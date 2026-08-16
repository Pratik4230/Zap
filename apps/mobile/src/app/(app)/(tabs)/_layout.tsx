import { useEffect } from "react";
import { Tabs } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppTabBar } from "@/global/components/app-tab-bar";
import { colors } from "@/global/theme";
import { apiClient } from "@/global/api/client";

const STREAK_PING_KEY = "streak_ping_date";

async function maybePingStreak(): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const last = await AsyncStorage.getItem(STREAK_PING_KEY);
    if (last === today) return;

    await apiClient.streak.ping();
    await AsyncStorage.setItem(STREAK_PING_KEY, today);
  } catch {
  }
}

export default function TabsLayout() {
  useEffect(() => {
    void maybePingStreak();
  }, []);

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
      <Tabs.Screen name="workspace" options={{ title: "Workspace" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
