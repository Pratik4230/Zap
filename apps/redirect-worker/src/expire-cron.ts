import { createDb, expireLinksPastDueDate } from "@xaply/db";

interface ExpireCronEnv {
  DB: D1Database;
  ZAP_CACHE: KVNamespace;
}

export async function runExpireLinksCron(env: ExpireCronEnv): Promise<{ expired: number }> {
  const db = createDb(env.DB);
  const slugs = await expireLinksPastDueDate(db);

  if (slugs.length === 0) {
    return { expired: 0 };
  }

  await Promise.all(slugs.map((slug) => env.ZAP_CACHE.delete(slug)));
  console.log(`[expire-cron] marked ${slugs.length} link(s) expired`);
  return { expired: slugs.length };
}
