import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { canManageTeam, createDb } from "@xaply/db";
import { workspaceInvitations } from "@xaply/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { forbidden, requireWorkspaceAccess } from "@/lib/workspace-context";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/invites/[id]", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `workspace-mutate:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    if (!canManageTeam(access.role)) return forbidden("You cannot revoke invites.");

    const { id } = await params;
    const db = createDb(env.DB);
    const [deleted] = await db
      .delete(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.id, id),
          eq(workspaceInvitations.workspaceId, access.workspaceId)
        )
      )
      .returning({ id: workspaceInvitations.id });

    if (!deleted) return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  });
}
