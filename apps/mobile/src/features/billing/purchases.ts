import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { PRO_ENTITLEMENT_ID } from "@/lib/billing";

let configured = false;

export async function configurePurchases() {
  if (configured || Platform.OS === "web") return;
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? "";
  if (!apiKey) return;

  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
  Purchases.configure({ apiKey });
  configured = true;
}

// Tie purchases to YOUR user id (e.g. Supabase auth id) so the
// subscription follows the user across devices, not the device/Google account.
export async function identifyPurchasesUser(userId: string) {
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

export function hasProEntitlement(info: CustomerInfo | null | undefined) {
  return !!info?.entitlements.active[PRO_ENTITLEMENT_ID];
}

export async function presentPaywall(): Promise<boolean> {
  const result = await RevenueCatUI.presentPaywall(); // shows the current offering
  return (
    result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED
  );
}

export async function restorePurchases() {
  return Purchases.restorePurchases();
}

export async function resetPurchasesUser() {
  await Purchases.logOut(); // call on sign-out
}
