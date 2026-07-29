import { Stack } from "expo-router";
import { colors } from "@/global/theme";

export const unstable_settings = {
  initialRouteName: "sign-in",
};

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
