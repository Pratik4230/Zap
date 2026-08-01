import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/global/theme";

type Edge = "top" | "bottom";

type ScreenShellProps = {
  children: ReactNode;
  /**
   * Safe-area edges to pad.
   * Tab screens: `["top"]` (tab bar owns bottom).
   * Stack / auth screens: `["top", "bottom"]`.
   */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
};

/**
 * RN wrapper around Compose Host / screen content with safe-area padding.
 * Prefer this over Uniwind SafeAreaView — insets stay on the RN shell.
 */
export function ScreenShell({
  children,
  edges = ["top"],
  style,
}: ScreenShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1"
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
          paddingTop: edges.includes("top") ? insets.top : 0,
          paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
