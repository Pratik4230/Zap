import type { Link } from "@xaply/db";

export async function getLinkFromCache(
  kv: KVNamespace,
  slug: string
): Promise<Link | null> {
  return kv.get<Link>(slug, "json");
}

export async function cacheLinkInKV(
  kv: KVNamespace,
  slug: string,
  link: Link
): Promise<void> {
  await kv.put(slug, JSON.stringify(link), { expirationTtl: 86400 });
}
