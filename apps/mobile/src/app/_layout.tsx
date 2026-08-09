import "../global.css";

import { useEffect, useRef, useState } from "react";
import { StatusBar as RNStatusBar, View } from "react-native";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  authClient,
  ensureAuthStorageHydrated,
} from "@/features/auth/utils/client";
import { applyOAuthCallbackUrl } from "@/features/auth/utils/oauth-callback";
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

/**
 * Root shell — providers only. Auth gating lives in `RootNavigator`.
 *
 * @see https://docs.expo.dev/router/advanced/authentication/
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <KeyboardProvider>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <RNStatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <OfflineBanner />
            <RootNavigator />
            <ToastRoot />
          </View>
        </KeyboardProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}

/**
 * `Stack.Protected` gates (app) vs (auth). After sign-in, screens call
 * `router.replace('/')` per the Expo auth guide — sign-out relies on the guard.
 */
function RootNavigator() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isLoggedIn = !!session?.user;
  const [storageReady, setStorageReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const didRestoreDeepLink = useRef(false);
  const oauthHandled = useRef(new Set<string>());

  useEffect(() => {
    void ensureAuthStorageHydrated().then(() => setStorageReady(true));
  }, []);

  useEffect(() => {
    if (!isPending && storageReady) {
      setAuthReady(true);
      SplashScreen.hide();
    }
  }, [isPending, storageReady]);

  useEffect(() => {
    async function handleOAuthReturn(url: string | null) {
      if (!url || oauthHandled.current.has(url)) return;
      oauthHandled.current.add(url);
      try {
        await applyOAuthCallbackUrl(url);
      } catch {
        oauthHandled.current.delete(url);
      }
    }

    void Linking.getInitialURL().then(handleOAuthReturn);
    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleOAuthReturn(url);
    });
    return () => subscription.remove();
  }, []);

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
    <>
      <PushBootstrap enabled={authReady && isLoggedIn} />
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
    </>
  );
}
