import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createDb, canManageTeam } from "@xaply/db";
import { workspaceMembers } from "@xaply/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { forbidden, requireWorkspaceAccess } from "@/lib/workspace-context";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/members/[userId]", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `workspace-mutate:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    if (!canManageTeam(access.role)) return forbidden("You cannot change member roles.");

    const { userId } = await params;
    if (!userId || userId === access.ownerId) {
      return NextResponse.json({ error: "Cannot change the owner role" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const role =
      body && typeof body === "object" && "role" in body
        ? String((body as { role: unknown }).role)
        : "";
    if (role !== "admin" && role !== "member") {
      return NextResponse.json({ error: "Role must be admin or member" }, { status: 400 });
    }

    const db = createDb(env.DB);
    const [updated] = await db
      .update(workspaceMembers)
      .set({ role, updatedAt: new Date() })
      .where(
        and(
          eq(workspaceMembers.workspaceId, access.workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .returning({ userId: workspaceMembers.userId, role: workspaceMembers.role });

    if (!updated) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json({ member: updated });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/members/[userId]", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `workspace-mutate:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    const { userId } = await params;
    const isSelf = userId === session.user.id;

    if (!isSelf && !canManageTeam(access.role)) {
      return forbidden("You cannot remove members.");
    }
    if (userId === access.ownerId) {
      return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
    }

    const db = createDb(env.DB);
    const [removed] = await db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, access.workspaceId),
          eq(workspaceMembers.userId, userId)
        )
      )
      .returning({ userId: workspaceMembers.userId });

    if (!removed) return NextResponse.json({ error: "Member not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  });
}
