import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Host, Icon } from "@expo/ui/jetpack-compose";
import LinkIcon from "@expo/material-symbols/link.xml";
import AnalyticsIcon from "@expo/material-symbols/analytics.xml";
import SettingsIcon from "@expo/material-symbols/settings.xml";
import { colors } from "@/theme";

const TAB_ITEMS = {
  index: { label: "Links", icon: LinkIcon },
  analytics: { label: "Analytics", icon: AnalyticsIcon },
  settings: { label: "Settings", icon: SettingsIcon },
} as const;

const TAB_MIN_HEIGHT = 48;

type TabName = keyof typeof TAB_ITEMS;

type AppTabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string; params?: object }>;
  };
  navigation: {
    emit: (event: {
      type: "tabPress";
      target: string;
      canPreventDefault: true;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

function getTab(routeName: string) {
  return TAB_ITEMS[routeName as TabName] ?? TAB_ITEMS.index;
}

/**
 * Bottom tab bar — Material Symbols via Compose Icon (XML won't render in RN Image).
 * Host uses pointerEvents="none" so Compose doesn't steal taps from Pressable.
 */
export function AppTabBar({ state, navigation }: AppTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderTopColor: "#2a2a2a",
        borderTopWidth: 1,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {state.routes.map((route, index) => {
        const selected = state.index === index;
        const { label, icon } = getTab(route.name);
        const tint = selected ? colors.primary : colors.muted;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={selected ? { selected: true } : {}}
            android_ripple={{
              color: "rgba(254, 154, 0, 0.12)",
              borderless: false,
            }}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!selected && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: TAB_MIN_HEIGHT,
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              paddingVertical: 6,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View pointerEvents="none">
              <Host
                matchContents
                colorScheme="dark"
                style={{ width: 28, height: 28 }}
              >
                <Icon source={icon} size={24} tint={tint} />
              </Host>
            </View>
            <Text
              style={{
                fontSize: 12,
                fontWeight: selected ? "700" : "500",
                color: tint,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
