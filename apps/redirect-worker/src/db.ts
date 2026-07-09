import { createDb, links, isLinkWithinClickLimit } from "@xaply/db";
import { and, eq, gt, isNull, or, lt } from "drizzle-orm";
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
        or(isNull(links.expiresAt), gt(links.expiresAt, now)),
        or(isNull(links.clickLimit), lt(links.clickCount, links.clickLimit))
      )
    )
    .limit(1);

  return result[0] ?? null;
}

export async function markLinkExpired(d1: D1Database, linkId: string): Promise<void> {
  const db = createDb(d1);
  await db
    .update(links)
    .set({ status: "expired", updatedAt: new Date() })
    .where(eq(links.id, linkId));
}

export function shouldExpireForClickLimit(link: Link): boolean {
  return link.clickLimit != null && !isLinkWithinClickLimit(link);
}
