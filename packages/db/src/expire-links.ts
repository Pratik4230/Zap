import { and, eq, isNotNull, lt } from "drizzle-orm";
import type { Db } from "./db";
import { links } from "./schema";

/** Mark active links past `expiresAt` as expired. Returns affected slugs for KV cleanup. */
export async function expireLinksPastDueDate(db: Db): Promise<string[]> {
  const now = new Date();
  const expired = await db
    .update(links)
    .set({ status: "expired", updatedAt: now })
    .where(
      and(
        eq(links.status, "active"),
        isNotNull(links.expiresAt),
        lt(links.expiresAt, now)
      )
    )
    .returning({ slug: links.slug });

  return expired.map((row) => row.slug);
}
