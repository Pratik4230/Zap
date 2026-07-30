import { Tabs } from "expo-router";
import { AppTabBar } from "@/global/components/app-tab-bar";
import { colors } from "@/global/theme";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      safeAreaInsets={{ top: 0 }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background, paddingTop: 0 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Links" }} />
      <Tabs.Screen name="analytics" options={{ title: "Analytics" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
