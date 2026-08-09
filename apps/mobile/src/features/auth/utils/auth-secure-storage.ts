import * as SecureStore from "expo-secure-store";

const cache = new Map<string, string>();

/**
 * Native secure stores reject values above ~2 KB. Mirrors @better-auth/expo
 * chunking so session cookies are not silently lost.
 *
 * @see https://github.com/better-auth/better-auth/issues/9151
 */
const STORAGE_VALUE_LIMIT = 1800;
const CHUNK_MARKER = "\u0001ba-chunks:";

function normalizeKey(key: string): string {
  return key.replace(/:/g, "_");
}

function readChunked(key: string, stored: string): string | null {
  if (!stored.startsWith(CHUNK_MARKER)) return stored;
  const count = Number(stored.slice(CHUNK_MARKER.length));
  if (!Number.isInteger(count) || count < 1) return null;
  let value = "";
  for (let i = 0; i < count; i++) {
    const chunk = cache.get(`${key}.${i}`);
    if (chunk == null) return null;
    value += chunk;
  }
  return value;
}

async function loadKeyFromSecureStore(key: string): Promise<string | null> {
  const normalized = normalizeKey(key);
  if (cache.has(normalized)) return cache.get(normalized) ?? null;

  try {
    const stored = await SecureStore.getItemAsync(normalized);
    if (stored == null) return null;

    if (!stored.startsWith(CHUNK_MARKER)) {
      cache.set(normalized, stored);
      return stored;
    }

    const count = Number(stored.slice(CHUNK_MARKER.length));
    if (!Number.isInteger(count) || count < 1) return null;

    let value = "";
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${normalized}.${i}`);
      if (chunk == null) return null;
      cache.set(`${normalized}.${i}`, chunk);
      value += chunk;
    }
    cache.set(normalized, stored);
    return value;
  } catch {
    return null;
  }
}

async function writeKeyToSecureStore(key: string, value: string): Promise<void> {
  const normalized = normalizeKey(key);
  try {
    if (value.length <= STORAGE_VALUE_LIMIT) {
      await SecureStore.setItemAsync(normalized, value);
      return;
    }

    await SecureStore.setItemAsync(normalized, "");
    const count = Math.ceil(value.length / STORAGE_VALUE_LIMIT);
    for (let i = 0; i < count; i++) {
      const start = i * STORAGE_VALUE_LIMIT;
      await SecureStore.setItemAsync(
        `${normalized}.${i}`,
        value.slice(start, start + STORAGE_VALUE_LIMIT),
      );
      cache.set(`${normalized}.${i}`, value.slice(start, start + STORAGE_VALUE_LIMIT));
    }
    await SecureStore.setItemAsync(normalized, `${CHUNK_MARKER}${count}`);
  } catch {
    // Memory cache still works for the current session.
  }
}

/** Better Auth Expo requires synchronous `getItem`; SecureStore is async-only. */
export const authSecureStorage = {
  getItem(key: string): string | null {
    const normalized = normalizeKey(key);
    const stored = cache.get(normalized);
    if (stored == null) return null;
    return readChunked(normalized, stored);
  },
  async setItem(key: string, value: string): Promise<void> {
    const normalized = normalizeKey(key);
    if (value.length <= STORAGE_VALUE_LIMIT) {
      cache.set(normalized, value);
      await writeKeyToSecureStore(normalized, value);
      return;
    }

    const count = Math.ceil(value.length / STORAGE_VALUE_LIMIT);
    for (let i = 0; i < count; i++) {
      const start = i * STORAGE_VALUE_LIMIT;
      cache.set(
        `${normalized}.${i}`,
        value.slice(start, start + STORAGE_VALUE_LIMIT),
      );
    }
    cache.set(normalized, `${CHUNK_MARKER}${count}`);
    await writeKeyToSecureStore(normalized, value);
  },
  async removeItem(key: string): Promise<void> {
    const normalized = normalizeKey(key);
    const stored = cache.get(normalized);
    if (stored?.startsWith(CHUNK_MARKER)) {
      const count = Number(stored.slice(CHUNK_MARKER.length));
      if (Number.isInteger(count) && count > 0) {
        for (let i = 0; i < count; i++) {
          cache.delete(`${normalized}.${i}`);
          try {
            await SecureStore.deleteItemAsync(`${normalized}.${i}`);
          } catch {
            // ignore
          }
        }
      }
    }
    cache.delete(normalized);
    try {
      await SecureStore.deleteItemAsync(normalized);
    } catch {
      // ignore
    }
  },
};

const AUTH_STORAGE_KEYS = ["xaply_cookie", "xaply_session_data"] as const;

/** Load persisted auth state into the sync cache (call once at startup). */
export async function hydrateAuthSecureStorage(): Promise<void> {
  await Promise.all(AUTH_STORAGE_KEYS.map((key) => loadKeyFromSecureStore(key)));
}

export const AUTH_COOKIE_STORAGE_KEY = AUTH_STORAGE_KEYS[0];
export const AUTH_SESSION_DATA_KEY = AUTH_STORAGE_KEYS[1];
