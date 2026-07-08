import { createDb, links } from "@xaply/db";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import type { Link } from "@xaply/db";

export async function getLinkBySlug(
  d1: D1Database,
  slug: string,
  domain: string
): Promise<Link | null> {
  const db = createDb(d1);
  const now = new Date();

  const result = await db
    .select()
    .from(links)
    .where(
      and(
        eq(links.slug, slug),
        eq(links.domain, domain),
        eq(links.status, "active"),
        or(isNull(links.expiresAt), gt(links.expiresAt, now))
      )
    )
    .limit(1);

  return result[0] ?? null;
}
