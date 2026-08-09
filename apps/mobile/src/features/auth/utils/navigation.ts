import { router } from "expo-router";
import { authClient } from "@/features/auth/utils/client";
import {
  AUTH_SESSION_DATA_KEY,
  authSecureStorage,
} from "@/features/auth/utils/auth-secure-storage";
import { getBearerTokenSync, hydrateBearerToken } from "@/features/auth/utils/bearer";

type SessionPayload = NonNullable<
  Awaited<ReturnType<typeof authClient.getSession>>["data"]
>;

/** Push session into the Better Auth atom so `useSession()` updates immediately. */
function publishAuthSession(data: SessionPayload) {
  const sessionAtom = authClient.$store.atoms.session;
  const current = sessionAtom.get();
  sessionAtom.set({
    data,
    error: null,
    isPending: false,
    isRefetching: false,
    refetch: current.refetch,
  });
}

/** Refresh session so `useSession` updates (e.g. after profile save). */
export async function refreshAuthSession() {
  await hydrateBearerToken();
  const result = await authClient.getSession();
  if (result.data?.user) {
    await authSecureStorage.setItem(
      AUTH_SESSION_DATA_KEY,
      JSON.stringify(result.data),
    );
    publishAuthSession(result.data);
  }
  return result;
}

/**
 * Confirm the session is established and persist the Expo session cache.
 */
export async function completeAuthSession() {
  await hydrateBearerToken();

  const { data, error } = await authClient.getSession();
  if (error || !data?.user) {
    const hasToken = Boolean(getBearerTokenSync());
    const hasCookie = Boolean(authClient.getCookie());
    throw new Error(
      hasToken || hasCookie
        ? (error?.message ?? "Session could not be loaded. Try again.")
        : "Sign-in did not establish a session. Check your connection and try again.",
    );
  }

  await authSecureStorage.setItem(AUTH_SESSION_DATA_KEY, JSON.stringify(data));
  publishAuthSession(data);
  return data;
}

/**
 * After sign-in / verify / OAuth: establish session then navigate home.
 * @see https://docs.expo.dev/router/advanced/authentication/
 */
export async function finishSignIn() {
  await completeAuthSession();
  router.replace("/");
}

/** @deprecated Use `finishSignIn` */
export async function enterApp() {
  await finishSignIn();
}
