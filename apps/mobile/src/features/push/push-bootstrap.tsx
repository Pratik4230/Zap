import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "@/features/push/register";
import { apiClient } from "@/global/api/client";
import { getApiErrorMessage } from "@/global/api/errors";

type PushBootstrapProps = {
  /** Only register when the user has a session. */
  enabled: boolean;
};

/**
 * Registers for push when `enabled`, saves token to the API, and listens
 * for receive / tap events.
 *
 * @see https://docs.expo.dev/push-notifications/receiving-notifications/
 */
export function PushBootstrap({ enabled }: PushBootstrapProps) {
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    void (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (cancelled || !token) return;
        tokenRef.current = token;
        const platform =
          Platform.OS === "android" || Platform.OS === "ios"
            ? Platform.OS
            : "unknown";
        await apiClient.push.registerToken(token, platform);
      } catch (error) {
        if (__DEV__) {
          console.warn("[push] register/save failed", getApiErrorMessage(error));
        }
      }
    })();

    const received = Notifications.addNotificationReceivedListener(
      (notification) => {
        if (__DEV__) {
          console.log(
            "[push] received (foreground)",
            notification.request.content,
          );
        }
      },
    );

    const response = Notifications.addNotificationResponseReceivedListener(
      (event) => {
        const data = event.notification.request.content.data as
          | { href?: string }
          | undefined;
        if (typeof data?.href === "string" && data.href.length > 0) {
          router.push(data.href as never);
        }
      },
    );

    return () => {
      cancelled = true;
      received.remove();
      response.remove();
    };
  }, [enabled]);

  return null;
}
