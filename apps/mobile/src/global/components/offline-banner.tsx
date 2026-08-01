import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsOnline } from "@/global/utils/network";
import { colors } from "@/global/theme";

/**
 * Global strip when the device has no usable network.
 * Overlay (not flow) so it doesn’t fight ScreenShell top insets.
 */
export function OfflineBanner() {
  const online = useIsOnline();
  const insets = useSafeAreaInsets();

  if (online) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        backgroundColor: "#3d2a00",
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(254, 154, 0, 0.35)",
      }}
    >
      <Text
        style={{
          color: colors.primary,
          fontSize: 13,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        You’re offline showing cached data when available
      </Text>
    </View>
  );
}
