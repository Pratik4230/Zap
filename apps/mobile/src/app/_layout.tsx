import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { authClient } from "../lib/auth-client";
import { colors } from "../lib/theme";

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

// Root / transition background — kills white flash between screens
void SystemUI.setBackgroundColorAsync(colors.background);

/**
 * Root layout — Expo Router protected routes (SDK 57+).
 * @see https://docs.expo.dev/router/advanced/authentication/
 * @see https://docs.expo.dev/router/advanced/protected/
 * @see https://docs.expo.dev/versions/v57.0.0/sdk/system-ui/
 * @see https://docs.expo.dev/versions/v57.0.0/sdk/keyboard-controller/
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
  );
}
