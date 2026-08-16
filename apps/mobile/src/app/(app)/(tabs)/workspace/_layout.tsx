import { Text, View } from "react-native";
import { Slot } from "expo-router";
import { ScreenShell } from "@/global/components/screen-shell";
import { colors } from "@/global/theme";
import { WorkspaceTopTabs } from "@/features/workspace/workspace-top-tabs";

/**
 * Workspace tab chrome: title + X-style top tabs + Slot.
 * Nested `Tabs` + Compose Host crashes Android (view already has a parent).
 */
export default function WorkspaceLayout() {
  return (
    <ScreenShell edges={["top"]}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            Workspaces
          </Text>
        </View>
        <WorkspaceTopTabs />
        <View style={{ flex: 1 }}>
          <Slot />
        </View>
      </View>
    </ScreenShell>
  );
}
