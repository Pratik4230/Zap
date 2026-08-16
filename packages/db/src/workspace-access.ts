import { and, count, eq, gt, inArray, ne } from "drizzle-orm";
import { createDb } from "./db";
import {
  clicks,
  linkClickMilestoneNotifications,
  links,
  users,
  workspaceInvitations,
  workspaceMembers,
  workspaceWebhooks,
  workspaces,
} from "./schema";
import {
  BUSINESS_MAX_OWNED_WORKSPACES,
  BUSINESS_MAX_TEAM_SEATS,
  MAX_WORKSPACE_MEMBERSHIPS,
  type WorkspacePlan,
  workspacePlanCacheKey,
} from "./plan-limits";
import { effectiveWorkspacePlan, getUserPlan } from "./plan";
import {
  ensureOwnerMembership,
  ensureUserWorkspace,
  workspaceSlugFromName,
} from "./workspace-billing";

export type WorkspaceRole = "owner" | "admin" | "member";
export type InviteRole = "admin" | "member";

export type WorkspaceAccess = {
  workspaceId: string;
  workspaceName: string;
  ownerId: string;
  plan: WorkspacePlan;
  role: WorkspaceRole;
  isOwner: boolean;
};

export function canManageBilling(role: WorkspaceRole): boolean {
  return role === "owner";
}

export function canManageTeam(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageWebhooks(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export class WorkspaceMutationError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "WorkspaceMutationError";
    this.status = status;
  }
}

export function isWorkspaceMutationError(
  error: unknown,
): error is WorkspaceMutationError {
  return (
    error instanceof WorkspaceMutationError ||
    (typeof error === "object" &&
      error !== null &&
      (error as Error).name === "WorkspaceMutationError" &&
      typeof (error as { status?: unknown }).status === "number")
  );
}

export async function countOwnedWorkspaces(
  db: D1Database,
  userId: string,
): Promise<number> {
  const drizzle = createDb(db);
  const [row] = await drizzle
    .select({ count: count() })
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId));
  return Number(row?.count ?? 0);
}

export async function countUserWorkspaceMemberships(
  db: D1Database,
  userId: string,
): Promise<number> {
  const drizzle = createDb(db);
  const [row] = await drizzle
    .select({ count: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId));
  return Number(row?.count ?? 0);
}

export function workspaceCreateLimitError(
  plan: WorkspacePlan,
  ownedCount: number,
  membershipCount: number,
): string | null {
  if (plan !== "business") {
    return "Creating extra workspaces requires the Business plan.";
  }
  if (ownedCount >= BUSINESS_MAX_OWNED_WORKSPACES) {
    return `You can create at most ${BUSINESS_MAX_OWNED_WORKSPACES} workspaces.`;
  }
  if (membershipCount >= MAX_WORKSPACE_MEMBERSHIPS) {
    return `You can belong to at most ${MAX_WORKSPACE_MEMBERSHIPS} workspaces.`;
  }
  return null;
}

export function workspaceMembershipLimitError(membershipCount: number): string | null {
  if (membershipCount >= MAX_WORKSPACE_MEMBERSHIPS) {
    return `You can belong to at most ${MAX_WORKSPACE_MEMBERSHIPS} workspaces.`;
  }
  return null;
}

export async function createOwnedWorkspace(
  db: D1Database,
  userId: string,
  name: string,
): Promise<{ id: string; name: string }> {
  const plan = await getUserPlan(db, userId);
  const [ownedCount, membershipCount] = await Promise.all([
    countOwnedWorkspaces(db, userId),
    countUserWorkspaceMemberships(db, userId),
  ]);
  const limitError = workspaceCreateLimitError(plan, ownedCount, membershipCount);
  if (limitError) {
    throw new WorkspaceMutationError(limitError, 403);
  }

  const drizzle = createDb(db);
  const [source] = await drizzle
    .select({
      plan: workspaces.plan,
      proGrantedUntil: workspaces.proGrantedUntil,
    })
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);

  const id = crypto.randomUUID();
  await drizzle.insert(workspaces).values({
    id,
    name,
    slug: workspaceSlugFromName(name),
    ownerId: userId,
    plan: source?.plan ?? plan,
    proGrantedUntil: source?.proGrantedUntil ?? null,
  });
  await ensureOwnerMembership(db, id, userId);
  return { id, name };
}

export async function renameOwnedWorkspace(
  db: D1Database,
  userId: string,
  workspaceId: string,
  name: string,
): Promise<void> {
  const drizzle = createDb(db);
  const [workspace] = await drizzle
    .select({ id: workspaces.id, ownerId: workspaces.ownerId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new WorkspaceMutationError("Workspace not found", 404);
  }
  if (workspace.ownerId !== userId) {
    throw new WorkspaceMutationError(
      "Only the workspace owner can rename it.",
      403,
    );
  }

  await drizzle
    .update(workspaces)
    .set({ name, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId));
}

export async function deleteOwnedWorkspace(
  db: D1Database,
  kv: KVNamespace,
  userId: string,
  workspaceId: string,
): Promise<{ fallbackWorkspaceId: string }> {
  const drizzle = createDb(db);
  const [workspace] = await drizzle
    .select({ id: workspaces.id, ownerId: workspaces.ownerId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) {
    throw new WorkspaceMutationError("Workspace not found", 404);
  }
  if (workspace.ownerId !== userId) {
    throw new WorkspaceMutationError(
      "Only the workspace owner can delete it.",
      403,
    );
  }

  const ownedCount = await countOwnedWorkspaces(db, userId);
  if (ownedCount <= 1) {
    throw new WorkspaceMutationError(
      "You cannot delete your last workspace. Create another one first, or delete your account instead.",
      400,
    );
  }

  const [fallback] = await drizzle
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.ownerId, userId), ne(workspaces.id, workspaceId)))
    .limit(1);

  if (!fallback) {
    throw new WorkspaceMutationError(
      "You cannot delete your last workspace.",
      400,
    );
  }

  const workspaceLinks = await drizzle
    .select({ id: links.id })
    .from(links)
    .where(eq(links.workspaceId, workspaceId));
  const linkIds = workspaceLinks.map((link) => link.id);
  if (linkIds.length > 0) {
    await drizzle.delete(clicks).where(inArray(clicks.linkId, linkIds));
    await drizzle
      .delete(linkClickMilestoneNotifications)
      .where(inArray(linkClickMilestoneNotifications.linkId, linkIds));
    await drizzle.delete(links).where(inArray(links.id, linkIds));
  }

  await drizzle
    .delete(workspaceWebhooks)
    .where(eq(workspaceWebhooks.workspaceId, workspaceId));
  await drizzle
    .delete(workspaceInvitations)
    .where(eq(workspaceInvitations.workspaceId, workspaceId));
  await drizzle
    .delete(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));
  await drizzle.delete(workspaces).where(eq(workspaces.id, workspaceId));
  await kv.delete(workspacePlanCacheKey(workspaceId));

  return { fallbackWorkspaceId: fallback.id };
}

export async function listUserWorkspaces(
  db: D1Database,
  userId: string,
  userName: string,
) {
  const ownedId = await ensureUserWorkspace(db, userId, userName);
  await ensureOwnerMembership(db, ownedId, userId);

  const drizzle = createDb(db);
  const rows = await drizzle
    .select({
      id: workspaces.id,
      name: workspaces.name,
      ownerId: workspaces.ownerId,
      plan: workspaces.plan,
      proGrantedUntil: workspaces.proGrantedUntil,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId));

  return rows.map((row) => {
    const plan = effectiveWorkspacePlan(row);
    const isOwner = row.ownerId === userId;
    const usable = isOwner || plan === "business";
    return {
      id: row.id,
      name: row.name,
      ownerId: row.ownerId,
      plan,
      role: row.role,
      isOwner,
      usable,
    };
  });
}

export async function resolveWorkspaceAccess(
  db: D1Database,
  userId: string,
  userName: string,
  requestedWorkspaceId: string | null,
): Promise<WorkspaceAccess> {
  const ownedId = await ensureUserWorkspace(db, userId, userName);
  await ensureOwnerMembership(db, ownedId, userId);

  const drizzle = createDb(db);
  const targetId = requestedWorkspaceId || ownedId;

  const [membership] = await drizzle
    .select({
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      ownerId: workspaces.ownerId,
      plan: workspaces.plan,
      proGrantedUntil: workspaces.proGrantedUntil,
      role: workspaceMembers.role,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, targetId),
      ),
    )
    .limit(1);

  if (membership) {
    const plan = effectiveWorkspacePlan(membership);
    const isOwner = membership.ownerId === userId;
    if (isOwner || plan === "business") {
      return {
        workspaceId: membership.workspaceId,
        workspaceName: membership.workspaceName,
        ownerId: membership.ownerId,
        plan,
        role: membership.role,
        isOwner,
      };
    }
  }

  const [owned] = await drizzle
    .select({
      id: workspaces.id,
      name: workspaces.name,
      ownerId: workspaces.ownerId,
      plan: workspaces.plan,
      proGrantedUntil: workspaces.proGrantedUntil,
    })
    .from(workspaces)
    .where(eq(workspaces.id, ownedId))
    .limit(1);

  return {
    workspaceId: ownedId,
    workspaceName: owned?.name ?? "My workspace",
    ownerId: userId,
    plan: owned ? effectiveWorkspacePlan(owned) : "free",
    role: "owner",
    isOwner: true,
  };
}

export async function countWorkspaceSeats(
  db: D1Database,
  workspaceId: string,
): Promise<number> {
  const drizzle = createDb(db);
  const now = new Date();

  const [membersRow] = await drizzle
    .select({ count: count() })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));

  const [invitesRow] = await drizzle
    .select({ count: count() })
    .from(workspaceInvitations)
    .where(
      and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        gt(workspaceInvitations.expiresAt, now),
      ),
    );

  return Number(membersRow?.count ?? 0) + Number(invitesRow?.count ?? 0);
}

export function assertBusinessSeatsAvailable(
  plan: WorkspacePlan,
  usedSeats: number,
): string | null {
  if (plan !== "business") {
    return "Team seats require the Business plan.";
  }
  if (usedSeats >= BUSINESS_MAX_TEAM_SEATS) {
    return `Team seat limit reached (${BUSINESS_MAX_TEAM_SEATS}).`;
  }
  return null;
}

export async function findUserIdByEmail(
  db: D1Database,
  email: string,
): Promise<{ id: string; email: string } | null> {
  const drizzle = createDb(db);
  const [user] = await drizzle
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return user ?? null;
}
