import { and, eq, sql } from "drizzle-orm";
import { createDb } from "./db";
import { links } from "./schema";
import { getMaxActiveLinks, type WorkspacePlan } from "./plan-limits";
import { getWorkspacePlan } from "./plan";

export async function countActiveLinks(
  db: D1Database,
  workspaceId: string
): Promise<number> {
  const drizzle = createDb(db);
  const [row] = await drizzle
    .select({ count: sql<number>`count(*)` })
    .from(links)
    .where(and(eq(links.workspaceId, workspaceId), eq(links.status, "active")));

  return Number(row?.count ?? 0);
}

export type ActiveLinkLimitResult =
  | { ok: true }
  | { ok: false; error: string; limit: number; plan: WorkspacePlan };

export async function assertCanAddActiveLink(
  db: D1Database,
  workspaceId: string
): Promise<ActiveLinkLimitResult> {
  const plan = await getWorkspacePlan(db, workspaceId);
  const limit = getMaxActiveLinks(plan);
  if (limit == null) return { ok: true };

  const activeCount = await countActiveLinks(db, workspaceId);

  if (activeCount >= limit) {
    const upgradeHint =
      plan === "free"
        ? " Upgrade to Pro for up to 500 active links."
        : plan === "pro"
          ? " Upgrade to Business for unlimited active links."
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
