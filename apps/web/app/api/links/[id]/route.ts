import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createAuth } from "@/lib/auth";
import { createDb } from "@xaply/db";
import { links } from "@xaply/db/schema";
import { eq, and } from "drizzle-orm";

async function getSession(request: NextRequest, env: CloudflareEnv) {
  const auth = createAuth(env.DB, env);
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  const session = await getSession(request, env);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as {
    status?: "active" | "paused";
    title?: string | null;
    destinationUrl?: string;
  };

  const updates: {
    status?: "active" | "paused";
    title?: string | null;
    destinationUrl?: string;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (body.status !== undefined) {
    if (body.status !== "active" && body.status !== "paused") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.title !== undefined) {
    updates.title = body.title?.trim() || null;
  }

  if (body.destinationUrl !== undefined) {
    if (!body.destinationUrl) {
      return NextResponse.json({ error: "destinationUrl is required" }, { status: 400 });
    }
    try {
      new URL(body.destinationUrl);
    } catch {
      return NextResponse.json({ error: "Invalid destination URL" }, { status: 400 });
    }
    updates.destinationUrl = body.destinationUrl;
  }

  const db = createDb(env.DB);
  const [updated] = await db
    .update(links)
    .set(updates)
    .where(and(eq(links.id, id), eq(links.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  void env.ZAP_CACHE.delete(updated.slug);

  return NextResponse.json({ link: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  const session = await getSession(request, env);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = createDb(env.DB);
  const [deleted] = await db
    .delete(links)
    .where(and(eq(links.id, id), eq(links.userId, session.user.id)))
    .returning();

  if (!deleted) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  void env.ZAP_CACHE.delete(deleted.slug);

  return NextResponse.json({ success: true });
}
