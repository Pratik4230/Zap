import { createDb } from "./db";
import { users, workspaces } from "./schema";
import { eq } from "drizzle-orm";
import {
  type WorkspacePlan,
  isWorkspacePlan,
  userPlanCacheKey,
  workspacePlanCacheKey,
} from "./plan-limits";
import type { Link } from "./types";

export function effectiveWorkspacePlan(workspace: {
  plan: WorkspacePlan | null;
  proGrantedUntil: Date | null;
}): WorkspacePlan {
  const plan = workspace.plan ?? "free";
  if (plan === "business") return "business";
  if (workspace.proGrantedUntil && workspace.proGrantedUntil > new Date()) {
    return "pro";
  }
  return plan;
}

export async function getWorkspacePlan(
  db: D1Database,
  workspaceId: string
): Promise<WorkspacePlan> {
  const drizzle = createDb(db);
  const [workspace] = await drizzle
    .select({ plan: workspaces.plan, proGrantedUntil: workspaces.proGrantedUntil })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace) return "free";
  return effectiveWorkspacePlan(workspace);
}

export async function getUserPlan(
  db: D1Database,
  userId: string
): Promise<WorkspacePlan> {
  const drizzle = createDb(db);
  const [workspace] = await drizzle
    .select({ plan: workspaces.plan, proGrantedUntil: workspaces.proGrantedUntil })
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);

  if (!workspace) return "free";
  return effectiveWorkspacePlan(workspace);
}

export async function getWorkspacePlanCached(
  kv: KVNamespace,
  db: D1Database,
  workspaceId: string
): Promise<WorkspacePlan> {
  const cached = await kv.get(workspacePlanCacheKey(workspaceId));
  if (isWorkspacePlan(cached)) return cached;

  const plan = await getWorkspacePlan(db, workspaceId);
  await kv.put(workspacePlanCacheKey(workspaceId), plan, { expirationTtl: 3600 });
  return plan;
}

export async function getUserPlanCached(
  kv: KVNamespace,
  db: D1Database,
  userId: string
): Promise<WorkspacePlan> {
  const cached = await kv.get(userPlanCacheKey(userId));
  if (isWorkspacePlan(cached)) return cached;

  const plan = await getUserPlan(db, userId);
  await kv.put(userPlanCacheKey(userId), plan, { expirationTtl: 3600 });
  return plan;
}

export async function getPlanForLink(
  kv: KVNamespace,
  db: D1Database,
  link: Pick<Link, "userId" | "workspaceId">
): Promise<WorkspacePlan> {
  if (link.workspaceId) {
    return getWorkspacePlanCached(kv, db, link.workspaceId);
  }
  return getUserPlanCached(kv, db, link.userId);
}

export function clickLimitAccountId(link: Pick<Link, "userId" | "workspaceId">): string {
  return link.workspaceId ?? link.userId;
}

export async function getUserEmail(
  db: D1Database,
  userId: string
): Promise<string | null> {
  const drizzle = createDb(db);
  const [user] = await drizzle
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user?.email ?? null;
}

export async function getWorkspaceOwnerEmail(
  db: D1Database,
  workspaceId: string
): Promise<string | null> {
  const drizzle = createDb(db);
  const [row] = await drizzle
    .select({ email: users.email })
    .from(workspaces)
    .innerJoin(users, eq(users.id, workspaces.ownerId))
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  return row?.email ?? null;
}
