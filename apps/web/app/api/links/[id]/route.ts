import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createDb, hashLinkPassword, toPublicLink, validateClickLimit, validateDestinationUrl, validateExpiresAt, validateLinkPassword, validateLinkStatus, validateTitle, assertCanAddActiveLink } from "@xaply/db";
import { links } from "@xaply/db/schema";
import { eq, and } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `mutate:${session.user.id}`,
    ...LINK_MUTATE_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  const { id } = await params;
  if (!id || typeof id !== "string" || id.length > 64) {
    return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const input = body as {
    status?: unknown;
    title?: unknown;
    destinationUrl?: unknown;
    expiresAt?: unknown;
    clickLimit?: unknown;
    password?: unknown;
  };

  const updates: {
    status?: "active" | "paused" | "expired";
    title?: string | null;
    destinationUrl?: string;
    expiresAt?: Date | null;
    clickLimit?: number | null;
    passwordHash?: string | null;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (input.status !== undefined) {
    const statusResult = validateLinkStatus(input.status);
    if (!statusResult.ok) {
      return NextResponse.json({ error: statusResult.error }, { status: 400 });
    }
    updates.status = statusResult.value;
  }

  if (input.title !== undefined) {
    const titleResult = validateTitle(input.title);
    if (!titleResult.ok) {
      return NextResponse.json({ error: titleResult.error }, { status: 400 });
    }
    updates.title = titleResult.value || null;
  }

  if (input.destinationUrl !== undefined) {
    const urlResult = validateDestinationUrl(input.destinationUrl);
    if (!urlResult.ok) {
      return NextResponse.json({ error: urlResult.error }, { status: 400 });
    }
    updates.destinationUrl = urlResult.value;
  }

  if (input.expiresAt !== undefined) {
    const expiresAtResult = validateExpiresAt(input.expiresAt);
    if (!expiresAtResult.ok) {
      return NextResponse.json({ error: expiresAtResult.error }, { status: 400 });
    }
    updates.expiresAt = expiresAtResult.value;
  }

  if (input.clickLimit !== undefined) {
    const clickLimitResult = validateClickLimit(input.clickLimit);
    if (!clickLimitResult.ok) {
      return NextResponse.json({ error: clickLimitResult.error }, { status: 400 });
    }
    updates.clickLimit = clickLimitResult.value;
  }

  if (input.password !== undefined) {
    if (input.password === null || input.password === "") {
      updates.passwordHash = null;
    } else {
      const passwordResult = validateLinkPassword(input.password);
      if (!passwordResult.ok) {
        return NextResponse.json({ error: passwordResult.error }, { status: 400 });
      }
      updates.passwordHash = await hashLinkPassword(passwordResult.value);
    }
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const db = createDb(env.DB);

  const [existing] = await db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.userId, session.user.id)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  if (updates.status === "active" && existing.status !== "active") {
    const activeLinkLimit = await assertCanAddActiveLink(env.DB, session.user.id);
    if (!activeLinkLimit.ok) {
      return NextResponse.json({ error: activeLinkLimit.error }, { status: 403 });
    }
  }

  if (
    updates.clickLimit != null &&
    existing.clickCount >= updates.clickLimit
  ) {
    return NextResponse.json(
      { error: "Click limit must be greater than current click count" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(links)
    .set(updates)
    .where(and(eq(links.id, id), eq(links.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  void env.ZAP_CACHE.delete(updated.slug);

  return NextResponse.json({ link: toPublicLink(updated) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `mutate:${session.user.id}`,
    ...LINK_MUTATE_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  const { id } = await params;
  if (!id || typeof id !== "string" || id.length > 64) {
    return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
  }

  const db = createDb(env.DB);
  const [deleted] = await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.userId, session.user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  void env.ZAP_CACHE.delete(deleted.slug);

  return NextResponse.json({ success: true });
}
