import { authClient } from "@/features/auth/utils/client";
import { getBearerTokenSync, hydrateBearerToken } from "@/features/auth/utils/bearer";

/** Refresh session so `useSession` updates (e.g. after profile save). */
export async function refreshAuthSession() {
  await hydrateBearerToken();
  return authClient.getSession();
}

/**
 * After sign-in / email verify: confirm the session is established.
 * Do NOT navigate — `Stack.Protected` in the root layout switches stacks when
 * `useSession()` sees a user. Explicit replace + setTimeout races cause remounts.
 */
export async function enterApp() {
  await hydrateBearerToken();

  const { data, error } = await authClient.getSession();
  if (error || !data?.user) {
    const hasToken = Boolean(getBearerTokenSync());
    const hasCookie = Boolean(authClient.getCookie());
    throw new Error(
      hasToken || hasCookie
        ? error?.message ?? "Session could not be loaded. Try again."
        : "Sign-in did not establish a session. Check your connection and try again."
    );
  }
}
