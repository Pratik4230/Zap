import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { authClient } from "@/features/auth/utils/client";
import { QueryProvider } from "@/global/query/provider";
import { colors } from "@/global/theme";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

void SystemUI.setBackgroundColorAsync(colors.background);

/**
 * Root layout — Stack.Protected auth gate (same pattern as Phase 1).
 * @see https://docs.expo.dev/router/advanced/authentication/
 */
export default function RootLayout() {
  const { data: session, isPending } = authClient.useSession();
  const isLoggedIn = !!session?.user;

  useEffect(() => {
    if (!isPending) {
      SplashScreen.hide();
    }
  }, [isPending]);

  return (
    <SafeAreaProvider>
      <QueryProvider>
        <KeyboardProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: "fade",
            }}
          >
            <Stack.Protected guard={!isPending && isLoggedIn}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>

            <Stack.Protected guard={!isPending && !isLoggedIn}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
        </KeyboardProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
