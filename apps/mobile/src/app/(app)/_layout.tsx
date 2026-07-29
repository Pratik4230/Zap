import { Stack } from "expo-router";
import { colors } from "@/theme";

/**
 * Authenticated stack — tabs live under (tabs); detail routes stack later.
 */
export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
