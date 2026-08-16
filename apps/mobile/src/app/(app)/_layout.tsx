import { Stack } from "expo-router";
import { View } from "react-native";
import { BiometricLockOverlay } from "@/features/auth/components/biometric-lock-overlay";
import { BiometricUnlockProvider } from "@/features/auth/components/biometric-unlock-provider";
import { colors } from "@/global/theme";

const slide = {
  animation: "slide_from_right" as const,
  gestureEnabled: true,
};

/**
 * Authenticated stack — biometric lock gates the whole app shell.
 */
export default function AppLayout() {
  return (
    <BiometricUnlockProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "fade",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="links/[id]" options={slide} />
          <Stack.Screen name="links/[id]/analytics" options={slide} />
          <Stack.Screen name="workspaces/index" />
          <Stack.Screen name="workspaces/team" />
          <Stack.Screen name="workspaces/webhooks/index" />
          <Stack.Screen name="workspaces/webhooks/[id]" options={slide} />
          <Stack.Screen name="invite/[token]" options={slide} />
        </Stack>
        <BiometricLockOverlay />
      </View>
    </BiometricUnlockProvider>
  );
}
