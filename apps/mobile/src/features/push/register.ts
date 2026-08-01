import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

/**
 * How to show a notification while the app is open (foreground).
 * Must be set early — before notifications arrive.
 *
 * @see https://docs.expo.dev/push-notifications/receiving-notifications/
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getEasProjectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

/**
 * Ask permission, ensure Android channel, return Expo push token (`ExponentPushToken[…]`).
 *
 * Flow (Android):
 * 1. Create a notification channel (required before token on Android 13+)
 * 2. Request POST_NOTIFICATIONS permission
 * 3. getExpoPushTokenAsync({ projectId }) → Expo Push Service addresses this device
 *    Expo then delivers via FCM using the service account on EAS.
 *
 * @see https://docs.expo.dev/push-notifications/push-notifications-setup/
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FE9A00",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.warn("[push] permission not granted");
    return null;
  }

  const projectId = getEasProjectId();
  if (!projectId) {
    console.warn("[push] missing EAS projectId in app config");
    return null;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  if (__DEV__) {
    console.log("[push] Expo push token:", token);
  }

  return token;
}
