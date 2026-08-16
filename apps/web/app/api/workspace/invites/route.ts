import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import {
  assertBusinessSeatsAvailable,
  canManageTeam,
  countWorkspaceSeats,
  countUserWorkspaceMemberships,
  createDb,
  sendWorkspaceInviteEmail,
  workspaceMembershipLimitError,
} from "@xaply/db";
import { users, workspaceInvitations, workspaceMembers, workspaces } from "@xaply/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { forbidden, requireWorkspaceAccess } from "@/lib/workspace-context";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/invites", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `workspace-invite:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    if (!canManageTeam(access.role)) return forbidden("You cannot invite members.");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const emailRaw =
      body && typeof body === "object" && "email" in body
        ? String((body as { email: unknown }).email)
        : "";
    const roleRaw =
      body && typeof body === "object" && "role" in body
        ? String((body as { role: unknown }).role)
        : "member";

    const email = emailRaw.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    if (roleRaw !== "admin" && roleRaw !== "member") {
      return NextResponse.json({ error: "Role must be admin or member" }, { status: 400 });
    }

    const seats = await countWorkspaceSeats(env.DB, access.workspaceId);
    const seatError = assertBusinessSeatsAvailable(access.plan, seats);
    if (seatError) return NextResponse.json({ error: seatError }, { status: 403 });

    const db = createDb(env.DB);
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      const [existingMember] = await db
        .select({ id: workspaceMembers.id })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, access.workspaceId),
            eq(workspaceMembers.userId, existingUser.id)
          )
        )
        .limit(1);
      if (existingMember) {
        return NextResponse.json({ error: "That person is already a member" }, { status: 409 });
      }
      const membershipCount = await countUserWorkspaceMemberships(env.DB, existingUser.id);
      const membershipError = workspaceMembershipLimitError(membershipCount);
      if (membershipError) {
        return NextResponse.json(
          { error: "That person already belongs to the maximum number of workspaces." },
          { status: 403 }
        );
      }
    }

    const [duplicate] = await db
      .select({ id: workspaceInvitations.id })
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, access.workspaceId),
          eq(workspaceInvitations.email, email)
        )
      )
      .limit(1);

    const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (duplicate) {
      await db
        .update(workspaceInvitations)
        .set({ role: roleRaw, token, invitedBy: session.user.id, expiresAt })
        .where(eq(workspaceInvitations.id, duplicate.id));
    } else {
      await db.insert(workspaceInvitations).values({
        id: crypto.randomUUID(),
        workspaceId: access.workspaceId,
        email,
        role: roleRaw,
        token,
        invitedBy: session.user.id,
        expiresAt,
      });
    }

    if (!env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email is not configured" }, { status: 500 });
    }

    const [workspace] = await db
      .select({ name: workspaces.name })
      .from(workspaces)
      .where(eq(workspaces.id, access.workspaceId))
      .limit(1);

    await sendWorkspaceInviteEmail({
      apiKey: env.RESEND_API_KEY,
      to: email,
      workspaceName: workspace?.name ?? access.workspaceName,
      inviterName: session.user.name,
      token,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  });
}
