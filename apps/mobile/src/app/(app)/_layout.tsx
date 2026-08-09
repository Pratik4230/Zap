import { Stack } from "expo-router";
import { View } from "react-native";
import { BiometricLockOverlay } from "@/features/auth/components/biometric-lock-overlay";
import { BiometricUnlockProvider } from "@/features/auth/components/biometric-unlock-provider";
import { colors } from "@/global/theme";

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
          <Stack.Screen name="links/[id]" />
          <Stack.Screen name="links/[id]/analytics" />
        </Stack>
        <BiometricLockOverlay />
      </View>
    </BiometricUnlockProvider>
  );
}
