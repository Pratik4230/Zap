import { Stack } from "expo-router";
import { colors } from "@/global/theme";

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
      <Stack.Screen name="links/[id]" />
      <Stack.Screen name="links/[id]/analytics" />
    </Stack>
  );
}
