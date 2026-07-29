import { router } from "expo-router";
import { authClient } from "@/features/auth/utils/client";

/** Authenticated home — Links tab ( (tabs)/index ). */
export const APP_HOME_HREF = "/" as const;

/** Refresh session after sign-in / verify so useSession updates. */
export async function refreshAuthSession() {
  await authClient.getSession();
}

/**
 * After auth succeeds, refresh session then enter the protected app stack.
 */
export async function enterApp() {
  await refreshAuthSession();
  router.replace(APP_HOME_HREF);
}
