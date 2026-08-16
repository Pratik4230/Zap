import * as WebBrowser from "expo-web-browser";
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import {
  authSecureStorage,
  hydrateAuthSecureStorage,
} from "@/features/auth/utils/auth-secure-storage";
import { API_URL } from "@/global/config/env";
import {
  captureAuthTokenFromHeaders,
  clearBearerToken,
  getBearerTokenSync,
  hydrateBearerToken,
} from "@/features/auth/utils/bearer";
import {
  clearWorkspaceId,
  hydrateWorkspaceId,
} from "@/features/workspace/workspace-id";

/** Required so OAuth redirects complete when returning to the app. */
WebBrowser.maybeCompleteAuthSession();

let storageHydratePromise: Promise<void> | null = null;

/** Await before trusting persisted cookies / bearer on cold start. */
export function ensureAuthStorageHydrated(): Promise<void> {
  if (!storageHydratePromise) {
    storageHydratePromise = Promise.all([
      hydrateBearerToken(),
      hydrateAuthSecureStorage(),
      hydrateWorkspaceId(),
    ]).then(() => undefined);
  }
  return storageHydratePromise;
}

void ensureAuthStorageHydrated();

/**
 * Better Auth client for Expo.
 * Uses expo cookie storage + Bearer token (set-auth-token) for reliable sessions.
 *
 * Scheme must stay `xaply` (app.json) so social callback deep links match
 * server `trustedOrigins` — do not rely on expo-router https `origin` for OAuth.
 *
 * @see https://better-auth.com/docs/integrations/expo
 * @see https://www.better-auth.com/docs/plugins/bearer
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "xaply",
      storagePrefix: "xaply",
      storage: authSecureStorage,
    }),
    emailOTPClient(),
  ],
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => getBearerTokenSync(),
    },
    onSuccess(ctx) {
      captureAuthTokenFromHeaders(ctx.response.headers);
    },
  },
});

export async function signOutFully() {
  try {
    await authClient.signOut();
  } finally {
    await clearBearerToken();
    await clearWorkspaceId();
  }
}
