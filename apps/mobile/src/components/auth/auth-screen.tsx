import type { ReactNode } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import {
  Column,
  Host,
  Text,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxWidth,
  paddingAll,
} from "@expo/ui/jetpack-compose/modifiers";
import { brand, colors } from "../../lib/theme";

type AuthScreenProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

/**
 * Shared dark + amber auth chrome (web-aligned).
 * Keyboard: react-native-keyboard-controller (not RN KeyboardAvoidingView).
 * @see https://docs.expo.dev/versions/v57.0.0/sdk/keyboard-controller/
 */
export function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Host
          matchContents
          colorScheme="dark"
          seedColor={colors.primary}
          style={{ width: "100%" }}
        >
          <Column
            modifiers={[fillMaxWidth(), paddingAll(8)]}
            verticalArrangement={{ spacedBy: 16 }}
          >
            <Text
              color={colors.primary}
              style={{ fontSize: 22, fontWeight: "700", letterSpacing: 0.3 }}
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
              <Text color={colors.muted} style={{ fontSize: 14 }}>
                {subtitle}
              </Text>
            </Column>

            {children}
          </Column>
        </Host>
      </KeyboardAwareScrollView>
    </View>
  );
}
