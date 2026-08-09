import { getSetCookie, hasBetterAuthCookies } from "@better-auth/expo/client";
import { authClient } from "@/features/auth/utils/client";
import {
  AUTH_COOKIE_STORAGE_KEY,
  authSecureStorage,
} from "@/features/auth/utils/auth-secure-storage";
import { setBearerToken } from "@/features/auth/utils/bearer";
import { finishSignIn } from "@/features/auth/utils/navigation";

const BETTER_AUTH_COOKIE_PREFIX = "better-auth";

function hasOAuthHandoff(url: URL): boolean {
  return url.searchParams.has("cookie") || url.searchParams.has("token");
}

/**
 * Apply session handoff from an OAuth deep link (`xaply:///?cookie=…&token=…`).
 * Safe to call multiple times; no-ops when the URL has no auth params.
 */
export async function applyOAuthCallbackUrl(callbackUrl: string): Promise<boolean> {
  let url: URL;
  try {
    url = new URL(callbackUrl);
  } catch {
    return false;
  }

  if (!hasOAuthHandoff(url)) return false;

  const token = url.searchParams.get("token");
  if (token) {
    await setBearerToken(token);
  }

  const returnedCookie = url.searchParams.get("cookie");
  if (returnedCookie && hasBetterAuthCookies(returnedCookie, BETTER_AUTH_COOKIE_PREFIX)) {
    const prev = authSecureStorage.getItem(AUTH_COOKIE_STORAGE_KEY) ?? "{}";
    const merged = getSetCookie(returnedCookie, prev);
    await authSecureStorage.setItem(AUTH_COOKIE_STORAGE_KEY, merged);
    authClient.$store.notify("$sessionSignal");
  }

  if (!token && !returnedCookie) {
    return false;
  }

  await finishSignIn();
  return true;
}
