import { createDb } from "./db";
import { users, workspaces } from "./schema";
import { eq } from "drizzle-orm";
import {
  type WorkspacePlan,
  userPlanCacheKey,
} from "./plan-limits";

export async function getUserPlan(
  db: D1Database,
  userId: string
): Promise<WorkspacePlan> {
  const drizzle = createDb(db);
  const [workspace] = await drizzle
    .select({ plan: workspaces.plan })
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);

  return workspace?.plan ?? "free";
}

export async function getUserPlanCached(
  kv: KVNamespace,
  db: D1Database,
  userId: string
): Promise<WorkspacePlan> {
  const cached = await kv.get(userPlanCacheKey(userId));
  if (cached === "free" || cached === "pro") return cached;

  const plan = await getUserPlan(db, userId);
  await kv.put(userPlanCacheKey(userId), plan, { expirationTtl: 3600 });
  return plan;
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
