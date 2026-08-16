import { Pressable, Text, View } from "react-native";
import { Link, usePathname } from "expo-router";
import { colors } from "@/global/theme";

const TABS = [
  { href: "/workspace" as const, title: "Manage" },
  { href: "/workspace/team" as const, title: "Team" },
  { href: "/workspace/webhooks" as const, title: "Webhooks" },
];

function isSelected(pathname: string, href: (typeof TABS)[number]["href"]) {
  if (href === "/workspace") return pathname === "/workspace";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** X-style top tabs — RN only, no nested tab navigator. */
export function WorkspaceTopTabs() {
  const pathname = usePathname();

  return (
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#2a2a2a",
        backgroundColor: colors.background,
      }}
    >
      {TABS.map((tab) => {
        const selected = isSelected(pathname, tab.href);
        return (
          <Link key={tab.href} href={tab.href} asChild>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={{
                flex: 1,
                alignItems: "center",
                paddingTop: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: selected ? "700" : "500",
                  color: selected ? colors.foreground : colors.muted,
                  paddingBottom: 10,
                }}
              >
                {tab.title}
              </Text>
              <View
                style={{
                  height: 3,
                  width: "42%",
                  borderRadius: 2,
                  backgroundColor: selected ? colors.primary : "transparent",
                }}
              />
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}
