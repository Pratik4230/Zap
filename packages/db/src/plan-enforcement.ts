import { and, eq, sql } from "drizzle-orm";
import { createDb } from "./db";
import { links } from "./schema";
import {
  getMaxActiveLinks,
  type WorkspacePlan,
} from "./plan-limits";
import { getUserPlan } from "./plan";

export async function countActiveLinks(
  db: D1Database,
  userId: string
): Promise<number> {
  const drizzle = createDb(db);
  const [row] = await drizzle
    .select({ count: sql<number>`count(*)` })
    .from(links)
    .where(and(eq(links.userId, userId), eq(links.status, "active")));

  return Number(row?.count ?? 0);
}

export type ActiveLinkLimitResult =
  | { ok: true }
  | { ok: false; error: string; limit: number; plan: WorkspacePlan };

export async function assertCanAddActiveLink(
  db: D1Database,
  userId: string
): Promise<ActiveLinkLimitResult> {
  const plan = await getUserPlan(db, userId);
  const limit = getMaxActiveLinks(plan);
  const activeCount = await countActiveLinks(db, userId);

  if (activeCount >= limit) {
    const upgradeHint =
      plan === "free"
        ? " Upgrade to Pro for up to 500 active links."
        : "";
    return {
      ok: false,
      error: `Active link limit reached (${limit}). Pause or delete a link.${upgradeHint}`,
      limit,
      plan,
    };
  }

  return { ok: true };
}
