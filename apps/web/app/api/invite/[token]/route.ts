import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import {
  assertBusinessSeatsAvailable,
  createDb,
  getWorkspacePlan,
  countUserWorkspaceMemberships,
  workspaceMembershipLimitError,
} from "@xaply/db";
import { workspaceInvitations, workspaceMembers, workspaces } from "@xaply/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { API_READ_LIMIT, LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { withWorkspaceCookie } from "@/lib/workspace-context";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/invite/[token]", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `invite-read:${session.user.id}`,
      ...API_READ_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const { token } = await params;
    const invite = await loadInvite(env.DB, token);
    if (!invite) return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 });

    return NextResponse.json({
      workspaceName: invite.workspaceName,
      email: invite.email,
      role: invite.role,
      matchesAccount: invite.email === session.user.email.toLowerCase(),
    });
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/invite/[token]", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `invite-accept:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const { token } = await params;
    const invite = await loadInvite(env.DB, token);
    if (!invite) return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 });

    if (invite.email !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: `Sign in as ${invite.email} to accept this invite` },
        { status: 403 }
      );
    }

    const plan = await getWorkspacePlan(env.DB, invite.workspaceId);
    const alreadyMember = await isMember(env.DB, invite.workspaceId, session.user.id);
    if (!alreadyMember) {
      const memberCount = await countMembers(env.DB, invite.workspaceId);
      const seatError = assertBusinessSeatsAvailable(plan, memberCount);
      if (seatError) return NextResponse.json({ error: seatError }, { status: 403 });

      const membershipCount = await countUserWorkspaceMemberships(env.DB, session.user.id);
      const membershipError = workspaceMembershipLimitError(membershipCount);
      if (membershipError) {
        return NextResponse.json({ error: membershipError }, { status: 403 });
      }
    }

    const db = createDb(env.DB);
    if (!alreadyMember) {
      await db.insert(workspaceMembers).values({
        id: crypto.randomUUID(),
        workspaceId: invite.workspaceId,
        userId: session.user.id,
        role: invite.role,
      });
    }

    await db.delete(workspaceInvitations).where(eq(workspaceInvitations.id, invite.id));

    return withWorkspaceCookie(
      NextResponse.json({ ok: true, workspaceId: invite.workspaceId }),
      invite.workspaceId
    );
  });
}

async function loadInvite(db: D1Database, token: string) {
  if (!token || token.length > 128) return null;
  const drizzle = createDb(db);
  const [row] = await drizzle
    .select({
      id: workspaceInvitations.id,
      workspaceId: workspaceInvitations.workspaceId,
      workspaceName: workspaces.name,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      expiresAt: workspaceInvitations.expiresAt,
    })
    .from(workspaceInvitations)
    .innerJoin(workspaces, eq(workspaces.id, workspaceInvitations.workspaceId))
    .where(eq(workspaceInvitations.token, token))
    .limit(1);

  if (!row || row.expiresAt <= new Date()) return null;
  return row;
}

async function isMember(db: D1Database, workspaceId: string, userId: string) {
  const drizzle = createDb(db);
  const [row] = await drizzle
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(
      and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId))
    )
    .limit(1);
  return Boolean(row);
}

async function countMembers(db: D1Database, workspaceId: string) {
  const drizzle = createDb(db);
  const rows = await drizzle
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));
  return rows.length;
}
