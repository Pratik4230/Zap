import * as WebBrowser from "expo-web-browser";
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "@/global/config/env";
import {
  captureAuthTokenFromHeaders,
  clearBearerToken,
  getBearerTokenSync,
  hydrateBearerToken,
} from "@/features/auth/utils/bearer";

/** Required so OAuth redirects complete when returning to the app. */
WebBrowser.maybeCompleteAuthSession();

void hydrateBearerToken();

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
      storage: SecureStore,
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
  }
}
