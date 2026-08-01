import type { ReactNode } from "react";
import { Column, Host, Text } from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  padding,
} from "@expo/ui/jetpack-compose/modifiers";
import { ScreenShell } from "@/global/components/screen-shell";
import { brand, colors } from "@/global/theme";

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
    <ScreenShell>
      <Host
        colorScheme="dark"
        seedColor={colors.primary}
        style={{ flex: 1, width: "100%" }}
      >
        <Column
          modifiers={[
            fillMaxSize(),
            fillMaxWidth(),
            padding(16, 4, 16, 12),
          ]}
          verticalArrangement={{ spacedBy: 10 }}
        >
          <Text
            color={colors.primary}
            style={{ fontSize: 12, fontWeight: "700", letterSpacing: 0.3 }}
          >
            {brand.name}
          </Text>

          <Column verticalArrangement={{ spacedBy: 4 }}>
            <Text
              color={colors.foreground}
              style={{ fontSize: 24, fontWeight: "700" }}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text color={colors.muted} style={{ fontSize: 13 }}>
                {subtitle}
              </Text>
            ) : null}
          </Column>

          {children}
        </Column>
      </Host>
    </ScreenShell>
  );
}
