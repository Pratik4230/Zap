export interface RateLimitResult {
  success: boolean;
  retryAfter?: number;
}

export async function rateLimitKv(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowId = Math.floor(now / windowSeconds);
  const kvKey = `rl:${key}:${windowId}`;

  const current = Number(await kv.get(kvKey)) || 0;
  if (current >= limit) {
    return { success: false, retryAfter: windowSeconds - (now % windowSeconds) };
  }

  await kv.put(kvKey, String(current + 1), { expirationTtl: windowSeconds });
  return { success: true };
}

/** 300 redirects per minute per IP */
export const REDIRECT_IP_LIMIT = { limit: 300, windowSeconds: 60 };
