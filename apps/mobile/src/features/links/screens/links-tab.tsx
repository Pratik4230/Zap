import { Text } from "@expo/ui/jetpack-compose";
import { AppScreen } from "@/global/components/app-screen";
import { colors } from "@/global/theme";

/** Default tab — Links home. */
export default function LinksTabScreen() {
  return (
    <AppScreen
      title="Links"
      subtitle="Your short links will show up here (Phase 2.3)."
    >
      <Text color={colors.muted} style={{ fontSize: 14 }}>
        Pull to refresh, search, and create links are coming next.
      </Text>
    </AppScreen>
  );
}
