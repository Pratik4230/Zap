import { and, eq, isNull } from "drizzle-orm";
import { createDb } from "./db";
import { links, users, workspaceMembers, workspaces } from "./schema";
import {
  type WorkspacePlan,
  userPlanCacheKey,
  workspacePlanCacheKey,
} from "./plan-limits";

export function workspaceSlugFromName(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "workspace";
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function ensureUserWorkspace(
  db: D1Database,
  userId: string,
  name: string,
): Promise<string> {
  const drizzle = createDb(db);
  const [existing] = await drizzle
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);

  if (existing) {
    await ensureOwnerMembership(db, existing.id, userId);
    await backfillLinkWorkspaceIds(db, existing.id, userId);
    return existing.id;
  }

  const id = crypto.randomUUID();
  await drizzle.insert(workspaces).values({
    id,
    name: (name ?? "").trim() || "My workspace",
    slug: workspaceSlugFromName(name),
    ownerId: userId,
    plan: "free",
  });
  await ensureOwnerMembership(db, id, userId);
  await backfillLinkWorkspaceIds(db, id, userId);

  return id;
}

async function backfillLinkWorkspaceIds(
  db: D1Database,
  workspaceId: string,
  userId: string,
): Promise<void> {
  const drizzle = createDb(db);
  await drizzle
    .update(links)
    .set({ workspaceId })
    .where(and(eq(links.userId, userId), isNull(links.workspaceId)));
}

export async function ensureOwnerMembership(
  db: D1Database,
  workspaceId: string,
  ownerId: string,
): Promise<void> {
  const drizzle = createDb(db);
  await drizzle
    .insert(workspaceMembers)
    .values({
      id: crypto.randomUUID(),
      workspaceId,
      userId: ownerId,
      role: "owner",
    })
    .onConflictDoNothing();
}

export async function setWorkspacePlanByUserId(
  db: D1Database,
  kv: KVNamespace,
  userId: string,
  plan: WorkspacePlan,
): Promise<void> {
  const drizzle = createDb(db);
  const [user] = await drizzle
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  const workspaceId = await ensureUserWorkspace(db, userId, user.name);
  await drizzle
    .update(workspaces)
    .set({ plan, updatedAt: new Date() })
    .where(eq(workspaces.ownerId, userId));

  await kv.delete(userPlanCacheKey(userId));
  await kv.delete(workspacePlanCacheKey(workspaceId));
}

export async function resolveUserIdForDodoCustomer(
  db: D1Database,
  metadataUserId: string | undefined,
  dodoCustomerId: string | undefined,
): Promise<string | null> {
  if (metadataUserId) return metadataUserId;

  if (!dodoCustomerId) return null;

  const drizzle = createDb(db);
  const [user] = await drizzle
    .select({ id: users.id })
    .from(users)
    .where(eq(users.dodoCustomerId, dodoCustomerId))
    .limit(1);

  return user?.id ?? null;
}

export function readDodoCustomerMetadata(payload: unknown): {
  userId?: string;
  dodoCustomerId?: string;
} {
  if (!payload || typeof payload !== "object") return {};

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return {};

  const customer = (data as { customer?: unknown }).customer;
  if (!customer || typeof customer !== "object") return {};

  const record = customer as {
    customer_id?: string;
    id?: string;
    metadata?: Record<string, string>;
  };

  return {
    userId: record.metadata?.userId,
    dodoCustomerId: record.customer_id ?? record.id,
  };
}
