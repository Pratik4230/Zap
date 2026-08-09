import {
  isRestorableAppPath,
  setPendingDeepLink,
} from "@/features/auth/utils/pending-deep-link";
import { rewriteAppLinkPath } from "@/features/auth/utils/rewrite-app-link";

/**
 * Rewrite inbound Android App Links / custom-scheme URLs before Expo Router.
 *
 * @see https://docs.expo.dev/router/advanced/native-intent/
 * @see https://docs.expo.dev/linking/android-app-links/
 */
export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    // OAuth return: xaply:///?cookie=… — route exists but session is applied by WebBrowser.
    if (/^xaply:/i.test(path)) {
      try {
        const url = new URL(path);
        const bare = `${url.pathname || "/"}${url.search}`;
        if (
          (url.pathname === "/" || url.pathname === "") &&
          url.searchParams.has("cookie")
        ) {
          return "/sign-in";
        }
        if (bare === "/" || bare === "") {
          return "/sign-in";
        }
      } catch {
        // fall through
      }
    }

    const rewritten = rewriteAppLinkPath(path);

    // Cold start only: stash for post-login when `Stack.Protected` hid `(app)`.
    // Warm links are applied via the returned path while the app is already open.
    if (
      initial &&
      isRestorableAppPath(rewritten.split("?")[0] ?? rewritten)
    ) {
      setPendingDeepLink(rewritten);
    }

    return rewritten;
  } catch {
    return "/sign-in";
  }
}
