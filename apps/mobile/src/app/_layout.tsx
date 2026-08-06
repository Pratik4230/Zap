import "../global.css";

import { useEffect, useRef, useState } from "react";
import { StatusBar as RNStatusBar, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { authClient } from "@/features/auth/utils/client";
import { hydrateBearerToken } from "@/features/auth/utils/bearer";
import { consumePendingDeepLink } from "@/features/auth/utils/pending-deep-link";
import { PushBootstrap } from "@/features/push/push-bootstrap";
import { OfflineBanner } from "@/global/components/offline-banner";
import { ToastRoot } from "@/global/components/toast";
import { QueryProvider } from "@/global/query/provider";
import { colors } from "@/global/theme";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

void SystemUI.setBackgroundColorAsync(colors.background);
void hydrateBearerToken();

/**
 * Root layout — Stack.Protected auth gate.
 * Session loading only gates the splash once; later refetches must NOT remount
 * auth/app (that caused sign-in to "refresh" after sign-out).
 *
 * App Links: `+native-intent` rewrites https://xaply.in/... → `/links/...`.
 * If the user was logged out, restore the pending path after sign-in.
 *
 * @see https://docs.expo.dev/router/advanced/authentication/
 * @see https://docs.expo.dev/linking/android-app-links/
 */
export default function RootLayout() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isLoggedIn = !!session?.user;
  /** Latched true after the first session resolution — never goes back to false. */
  const [authReady, setAuthReady] = useState(false);
  const didRestoreDeepLink = useRef(false);

  useEffect(() => {
    if (!isPending) {
      setAuthReady(true);
      SplashScreen.hide();
    }
  }, [isPending]);

  useEffect(() => {
    if (!authReady || !isLoggedIn || didRestoreDeepLink.current) return;
    const pending = consumePendingDeepLink();
    if (!pending || pending === "/") return;
    didRestoreDeepLink.current = true;
    router.replace(pending as never);
  }, [authReady, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) {
      didRestoreDeepLink.current = false;
    }
  }, [isLoggedIn]);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <KeyboardProvider>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <RNStatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <OfflineBanner />
            {/* Push after auth is known; registers only when logged in. */}
            {authReady ? <PushBootstrap enabled={isLoggedIn} /> : null}
            {authReady ? (
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.background },
                  animation: "fade",
                }}
              >
                <Stack.Protected guard={isLoggedIn}>
                  <Stack.Screen name="(app)" />
                </Stack.Protected>

                <Stack.Protected guard={!isLoggedIn}>
                  <Stack.Screen name="(auth)" />
                </Stack.Protected>
              </Stack>
            ) : null}
            {/* Must be last sibling so toasts overlay navigation */}
            <ToastRoot />
          </View>
        </KeyboardProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
