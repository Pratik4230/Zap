import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { getSetCookie } from "@better-auth/expo/client";
import { authClient } from "@/features/auth/utils/client";
import { applyOAuthCallbackUrl } from "@/features/auth/utils/oauth-callback";
import {
  AUTH_COOKIE_STORAGE_KEY,
  authSecureStorage,
} from "@/features/auth/utils/auth-secure-storage";
import { captureAuthTokenFromHeaders } from "@/features/auth/utils/bearer";
import { API_URL } from "@/global/config/env";

const EXPO_SCHEME = "xaply";

/** Base64url-encode the Google authorization URL (ASCII-safe). */
function toBase64Url(value: string): string {
  const base64 = globalThis.btoa(value);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function formatAuthError(message: string): string {
  return message.trim() || "Google sign-in failed";
}

function expoOrigin(): string {
  return Linking.createURL("", { scheme: EXPO_SCHEME });
}

function callbackUrls() {
  return {
    callbackURL: Linking.createURL("/sign-in", { scheme: EXPO_SCHEME }),
    errorCallbackURL: Linking.createURL("/sign-in", { scheme: EXPO_SCHEME }),
  };
}

async function persistSetCookieHeader(setCookie: string | null): Promise<void> {
  if (!setCookie) return;
  const prev = authSecureStorage.getItem(AUTH_COOKIE_STORAGE_KEY) ?? "{}";
  const merged = getSetCookie(setCookie, prev);
  await authSecureStorage.setItem(AUTH_COOKIE_STORAGE_KEY, merged);
}

/**
 * Google OAuth via Better Auth Expo proxy.
 *
 * The default `signIn.social` path fails because:
 * 1. `expo-authorization-proxy` needs `oauthState` in the query string.
 * 2. The bundled client looks for an `oauth_state` cookie that Better Auth
 *    does not set (it uses `state` in the Google authorization URL instead).
 * 3. Passing `authorizationURL` in the built-in proxy GET query truncates at `&`
 *    and drops `redirect_uri` — use `/api/auth/mobile-oauth-start?u=<base64url>`.
 *
 * Google Cloud Console: use a **Web** OAuth client only. Authorized redirect URI:
 * `https://xaply.in/api/auth/callback/google` — no Android client needed for this flow.
 *
 * @see https://www.better-auth.com/docs/integrations/expo#social-sign-in
 */
export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const { callbackURL, errorCallbackURL } = callbackUrls();

  const startRes = await fetch(`${API_URL}/api/auth/sign-in/social`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "expo-origin": expoOrigin(),
      "x-skip-oauth-proxy": "true",
      Cookie: authClient.getCookie(),
    },
    body: JSON.stringify({
      provider: "google",
      callbackURL,
      errorCallbackURL,
    }),
  });

  captureAuthTokenFromHeaders(startRes.headers);
  await persistSetCookieHeader(startRes.headers.get("set-cookie"));

  const startBody = (await startRes.json().catch(() => null)) as
    | { url?: string; redirect?: boolean; message?: string }
    | null;

  if (!startRes.ok) {
    return {
      error: formatAuthError(startBody?.message ?? `Sign-in failed (${startRes.status})`),
    };
  }

  const authorizationURL = startBody?.url;
  if (!authorizationURL) {
    return { error: "Google sign-in did not return an authorization URL." };
  }

  let redirectUri: string | null = null;
  try {
    redirectUri = new URL(authorizationURL).searchParams.get("redirect_uri");
  } catch {
    redirectUri = null;
  }
  if (!redirectUri) {
    return {
      error: "Google sign-in URL is invalid (missing redirect_uri). Try again.",
    };
  }

  const oauthStartURL = `${API_URL}/api/auth/mobile-oauth-start?${new URLSearchParams({
    u: toBase64Url(authorizationURL),
  }).toString()}`;

  if (Platform.OS === "android") {
    try {
      await WebBrowser.dismissAuthSession();
    } catch {
      // ignore
    }
  }

  const result = await WebBrowser.openAuthSessionAsync(oauthStartURL, callbackURL);

  if (result.type === "cancel" || result.type === "dismiss") {
    return { error: null };
  }
  if (result.type !== "success") {
    return { error: "Google sign-in was interrupted. Try again." };
  }

  try {
    const applied = await applyOAuthCallbackUrl(result.url);
    if (!applied) {
      return {
        error:
          "Google sign-in completed but no session was returned. Check trustedOrigins on the server.",
      };
    }
    return { error: null };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Signed in with Google, but could not open the app.",
    };
  }
}
