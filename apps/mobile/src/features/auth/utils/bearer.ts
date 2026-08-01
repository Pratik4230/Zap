import * as SecureStore from "expo-secure-store";

/**
 * Bearer token for Better Auth mobile sessions.
 * Cookies alone are unreliable on React Native / Cloudflare (Set-Cookie often
 * not persisted). Server already enables `bearer()` — we store `set-auth-token`.
 *
 * @see https://www.better-auth.com/docs/plugins/bearer
 */
const BEARER_KEY = "xaply_bearer_token";

let memoryToken: string | null = null;
let hydratePromise: Promise<void> | null = null;

export function getBearerTokenSync(): string {
  return memoryToken ?? "";
}

export async function hydrateBearerToken(): Promise<void> {
  if (hydratePromise) return hydratePromise;
  hydratePromise = (async () => {
    try {
      memoryToken = await SecureStore.getItemAsync(BEARER_KEY);
    } catch {
      memoryToken = null;
    }
  })();
  return hydratePromise;
}

export async function setBearerToken(token: string): Promise<void> {
  memoryToken = token;
  try {
    await SecureStore.setItemAsync(BEARER_KEY, token);
  } catch {
    // Memory token still works for this session
  }
}

export async function clearBearerToken(): Promise<void> {
  memoryToken = null;
  try {
    await SecureStore.deleteItemAsync(BEARER_KEY);
  } catch {
    // ignore
  }
}

/** Capture `set-auth-token` from Better Auth responses. */
export function captureAuthTokenFromHeaders(headers: Headers): void {
  const token = headers.get("set-auth-token");
  if (token) {
    void setBearerToken(token);
  }
}
