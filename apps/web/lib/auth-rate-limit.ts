/** KV-backed storage for Better Auth rate limit counters (Workers-safe). */
export function createAuthRateLimitStorage(kv: KVNamespace) {
  const prefix = "ba-rl:";

  return {
    get: async (key: string) => {
      const raw = await kv.get(`${prefix}${key}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as {
          key: string;
          count: number;
          lastRequest: number;
        };
      } catch {
        return null;
      }
    },
    set: async (
      key: string,
      value: { key: string; count: number; lastRequest: number }
    ) => {
      await kv.put(`${prefix}${key}`, JSON.stringify(value), {
        expirationTtl: 3600,
      });
    },
  };
}
