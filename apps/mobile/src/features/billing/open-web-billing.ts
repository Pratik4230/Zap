import * as WebBrowser from "expo-web-browser";
import { API_URL } from "@/global/config/env";
import { colors } from "@/global/theme";

export const WEB_BILLING_URL = `${API_URL}/settings`;

async function openXaplyWeb(url: string): Promise<WebBrowser.WebBrowserResult> {
  return WebBrowser.openBrowserAsync(url, {
    toolbarColor: colors.background,
    controlsColor: colors.primary,
    enableBarCollapsing: true,
    showTitle: true,
    createTask: false,
  });
}

/**
 * Opens Xaply web billing in an in-app browser (Chrome Custom Tabs on Android).
 */
export async function openWebBilling(): Promise<WebBrowser.WebBrowserResult> {
  return openXaplyWeb(WEB_BILLING_URL);
}
