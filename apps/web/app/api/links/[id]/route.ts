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
  const body = await request.json() as { status?: "active" | "paused"; title?: string; destinationUrl?: string };

  const db = createDb(env.DB);
  const [updated] = await db
    .update(links)
    .set({ ...body, updatedAt: new Date() })
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
