import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "./env";

/**
 * Better Auth client for Expo.
 * Sessions/cookies live in SecureStore via expoClient.
 * expo-network is a peer of @better-auth/expo — used internally to pause
 * session refresh while offline (you do not call it directly).
 *
 * @see https://better-auth.com/docs/integrations/expo
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
});
