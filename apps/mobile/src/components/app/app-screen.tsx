import type { ReactNode } from "react";
import { View } from "react-native";
import { Column, Host, Text } from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  paddingAll,
} from "@expo/ui/jetpack-compose/modifiers";
import { brand, colors } from "@/theme";

type AppScreenProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

/**
 * Shared chrome for authenticated tab screens.
 * Uses flex Host (not matchContents) so screens fill the tab scene.
 */
export function AppScreen({ title, subtitle, children }: AppScreenProps) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <Host
        colorScheme="dark"
        seedColor={colors.primary}
        style={{ flex: 1, width: "100%" }}
      >
        <Column
          modifiers={[fillMaxSize(), fillMaxWidth(), paddingAll(24)]}
          verticalArrangement={{ spacedBy: 12 }}
        >
          <Text
            color={colors.primary}
            style={{ fontSize: 14, fontWeight: "700", letterSpacing: 0.4 }}
          >
            {brand.name}
          </Text>

          <Column verticalArrangement={{ spacedBy: 6 }}>
            <Text
              color={colors.foreground}
              style={{ fontSize: 28, fontWeight: "700" }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text color={colors.muted} style={{ fontSize: 14 }}>
                {subtitle}
              </Text>
            ) : null}
          </Column>

          {children}
        </Column>
      </Host>
    </View>
  );
}
