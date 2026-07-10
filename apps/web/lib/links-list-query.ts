import { createDb } from "@xaply/db";
import { links } from "@xaply/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import {
  escapeLikePattern,
  type LinkSortOption,
  type LinkStatusFilter,
  type LinksListParams,
} from "@/lib/filter-links";

function buildLinksWhere(userId: string, q: string, status: LinkStatusFilter): SQL | undefined {
  const conditions: SQL[] = [eq(links.userId, userId)];

  if (status !== "all") {
    conditions.push(eq(links.status, status));
  }

  if (q) {
    const pattern = `%${escapeLikePattern(q)}%`;
    const searchMatch = or(
      like(links.slug, pattern),
      like(links.title, pattern),
      like(links.destinationUrl, pattern),
      like(links.domain, pattern)
    );
    if (searchMatch) conditions.push(searchMatch);
  }

  return and(...conditions);
}

function buildLinksOrder(sort: LinkSortOption) {
  if (sort === "clicks") return desc(links.clickCount);
  if (sort === "oldest") return asc(links.createdAt);
  return desc(links.createdAt);
}

export async function queryLinksPage(db: ReturnType<typeof createDb>, userId: string, params: LinksListParams) {
  const where = buildLinksWhere(userId, params.q, params.status);
  const offset = (params.page - 1) * params.limit;

  const [countRow] = await db
    .select({ total: count() })
    .from(links)
    .where(where);

  const total = Number(countRow?.total ?? 0);

  const rows = await db
    .select()
    .from(links)
    .where(where)
    .orderBy(buildLinksOrder(params.sort))
    .limit(params.limit)
    .offset(offset);

  return {
    links: rows,
    page: params.page,
    limit: params.limit,
    total,
    hasMore: offset + rows.length < total,
  };
}

export async function queryLinksSummary(db: ReturnType<typeof createDb>, userId: string) {
  const [row] = await db
    .select({
      totalLinks: count(),
      totalClicks: sql<number>`coalesce(sum(${links.clickCount}), 0)`,
      activeLinks: sql<number>`coalesce(sum(case when ${links.status} = 'active' then 1 else 0 end), 0)`,
    })
    .from(links)
    .where(eq(links.userId, userId));

  const totalLinks = Number(row?.totalLinks ?? 0);
  const activeLinks = Number(row?.activeLinks ?? 0);

  return {
    totalLinks,
    totalClicks: Number(row?.totalClicks ?? 0),
    activeLinks,
    activeRate: totalLinks > 0 ? Math.round((activeLinks / totalLinks) * 100) : 0,
  };
}
