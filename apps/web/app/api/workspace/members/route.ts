import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createDb, countWorkspaceSeats, BUSINESS_MAX_TEAM_SEATS } from "@xaply/db";
import { users, workspaceInvitations, workspaceMembers } from "@xaply/db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { API_READ_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { requireWorkspaceAccess } from "@/lib/workspace-context";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/members", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `workspace-members:${session.user.id}`,
      ...API_READ_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    const db = createDb(env.DB);
    const now = new Date();

    const [members, invites, seats] = await Promise.all([
      db
        .select({
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          name: users.name,
          email: users.email,
          createdAt: workspaceMembers.createdAt,
        })
        .from(workspaceMembers)
        .innerJoin(users, eq(users.id, workspaceMembers.userId))
        .where(eq(workspaceMembers.workspaceId, access.workspaceId))
        .orderBy(desc(workspaceMembers.createdAt)),
      db
        .select({
          id: workspaceInvitations.id,
          email: workspaceInvitations.email,
          role: workspaceInvitations.role,
          expiresAt: workspaceInvitations.expiresAt,
          createdAt: workspaceInvitations.createdAt,
        })
        .from(workspaceInvitations)
        .where(
          and(
            eq(workspaceInvitations.workspaceId, access.workspaceId),
            gt(workspaceInvitations.expiresAt, now)
          )
        ),
      countWorkspaceSeats(env.DB, access.workspaceId),
    ]);

    return NextResponse.json({
      workspace: {
        id: access.workspaceId,
        name: access.workspaceName,
        plan: access.plan,
        role: access.role,
        isOwner: access.isOwner,
      },
      members,
      invites,
      seats: {
        used: seats,
        max: access.plan === "business" ? BUSINESS_MAX_TEAM_SEATS : 1,
      },
    });
  });
}
