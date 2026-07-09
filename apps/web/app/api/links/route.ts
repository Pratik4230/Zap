import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import {
  createDb,
  SHORT_LINK_DOMAIN,
  validateClickLimit,
  validateDestinationUrl,
  validateExpiresAt,
  validateSlug,
  validateTitle,
} from "@xaply/db";
import { links } from "@xaply/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { isSession, requireSession } from "@/lib/api-auth";
import { API_READ_LIMIT, LINK_CREATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `read:${session.user.id}`,
    ...API_READ_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  const db = createDb(env.DB);
  const userLinks = await db
    .select()
    .from(links)
    .where(eq(links.userId, session.user.id))
    .orderBy(desc(links.createdAt));

  return NextResponse.json({ links: userLinks });
}

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `create:${session.user.id}`,
    ...LINK_CREATE_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { destinationUrl, slug, title, expiresAt, clickLimit } = body as {
    destinationUrl?: unknown;
    slug?: unknown;
    title?: unknown;
    expiresAt?: unknown;
    clickLimit?: unknown;
  };

  const urlResult = validateDestinationUrl(destinationUrl);
  if (!urlResult.ok) {
    return NextResponse.json({ error: urlResult.error }, { status: 400 });
  }

  const titleResult = validateTitle(title);
  if (!titleResult.ok) {
    return NextResponse.json({ error: titleResult.error }, { status: 400 });
  }

  const expiresAtResult = validateExpiresAt(expiresAt);
  if (!expiresAtResult.ok) {
    return NextResponse.json({ error: expiresAtResult.error }, { status: 400 });
  }

  const clickLimitResult = validateClickLimit(clickLimit);
  if (!clickLimitResult.ok) {
    return NextResponse.json({ error: clickLimitResult.error }, { status: 400 });
  }

  let finalSlug: string;
  if (slug === undefined || slug === null || slug === "") {
    finalSlug = nanoid(7);
  } else {
    const slugResult = validateSlug(slug);
    if (!slugResult.ok) {
      return NextResponse.json({ error: slugResult.error }, { status: 400 });
    }
    finalSlug = slugResult.value;
  }

  const db = createDb(env.DB);

  try {
    const [link] = await db
      .insert(links)
      .values({
        id: nanoid(),
        userId: session.user.id,
        slug: finalSlug,
        domain: SHORT_LINK_DOMAIN,
        destinationUrl: urlResult.value,
        title: titleResult.value || null,
        expiresAt: expiresAtResult.value,
        clickLimit: clickLimitResult.value,
        status: "active",
      })
      .returning();

    void env.ZAP_CACHE.put(finalSlug, JSON.stringify(link), { expirationTtl: 60 * 60 * 24 * 7 });

    return NextResponse.json({ link }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }
}
