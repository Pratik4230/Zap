import { createDb } from "@xaply/db";
import { links, users, workspaces } from "@xaply/db/schema";
import {
  asc,
  count,
  desc,
  eq,
  like,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { AdminUsersListParams } from "@/lib/filter-admin-users";
import { buildAdminUserSearchPattern } from "@/lib/filter-admin-users";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  plan: "free" | "pro" | null;
  totalLinks: number;
  totalClicks: number;
}

function buildUsersWhere(q: string): SQL | undefined {
  const pattern = buildAdminUserSearchPattern(q);
  if (!pattern) return undefined;

  const searchMatch = or(like(users.email, pattern), like(users.name, pattern));
  return searchMatch ?? undefined;
}

function buildUsersOrder(sort: AdminUsersListParams["sort"]) {
  if (sort === "oldest") return asc(users.createdAt);
  return desc(users.createdAt);
}

export async function queryAdminUsersPage(
  db: ReturnType<typeof createDb>,
  params: AdminUsersListParams
) {
  const where = buildUsersWhere(params.q);
  const offset = (params.page - 1) * params.limit;

  const [countRow] = await db.select({ total: count() }).from(users).where(where);
  const total = Number(countRow?.total ?? 0);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      plan: workspaces.plan,
      totalLinks: count(links.id),
      totalClicks: sql<number>`coalesce(sum(${links.clickCount}), 0)`,
    })
    .from(users)
    .leftJoin(workspaces, eq(workspaces.ownerId, users.id))
    .leftJoin(links, eq(links.userId, users.id))
    .where(where)
    .groupBy(users.id)
    .orderBy(buildUsersOrder(params.sort))
    .limit(params.limit)
    .offset(offset);

  const userRows: AdminUserRow[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    plan: row.plan ?? null,
    totalLinks: Number(row.totalLinks),
    totalClicks: Number(row.totalClicks),
  }));

  return {
    users: userRows,
    page: params.page,
    limit: params.limit,
    total,
    hasMore: offset + userRows.length < total,
  };
}
