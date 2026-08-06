import * as WebBrowser from "expo-web-browser";
import { API_URL } from "@/global/config/env";
import { colors } from "@/global/theme";

/** Dashboard billing / Pro upgrade (Dodo on web). */
export const WEB_BILLING_URL = `${API_URL}/settings`;

/**
 * Opens Xaply web billing in an in-app browser (Chrome Custom Tabs on Android).
 * Does not leave the app for an external browser tab switcher.
 *
 * Note: the Custom Tab has its own cookie jar — user may need to sign in on
 * web with the same account before upgrading. After dismiss, callers should
 * refetch `GET /api/billing`.
 *
 * @see https://docs.expo.dev/versions/v57.0.0/sdk/webbrowser/
 */
export async function openWebBilling(): Promise<WebBrowser.WebBrowserResult> {
  return WebBrowser.openBrowserAsync(WEB_BILLING_URL, {
    toolbarColor: colors.background,
    controlsColor: colors.primary,
    enableBarCollapsing: true,
    showTitle: true,
    createTask: false,
  });
}
