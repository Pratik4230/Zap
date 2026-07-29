import { Text } from "@expo/ui/jetpack-compose";
import { AppScreen } from "@/global/components/app-screen";
import { colors } from "@/global/theme";

export default function AnalyticsTabScreen() {
  return (
    <AppScreen
      title="Analytics"
      subtitle="Account-wide click stats land here in Phase 3."
    >
      <Text color={colors.muted} style={{ fontSize: 14 }}>
        Charts for clicks, countries, and devices are on the way.
      </Text>
    </AppScreen>
  );
}
