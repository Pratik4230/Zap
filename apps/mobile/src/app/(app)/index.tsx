import { View, Text, Pressable } from "react-native";
import { authClient } from "../../lib/auth-client";
import { colors } from "../../lib/theme";

/**
 * Authenticated home placeholder until Phase 2 tabs / links.
 */
export default function AppHomeScreen() {
  const { data: session } = authClient.useSession();
  const name = session?.user?.name ?? session?.user?.email ?? "there";

  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: colors.background }}
    >
      <Text
        className="mb-2 text-4xl font-extrabold tracking-tight"
        style={{ color: colors.primary }}
      >
        Xaply
      </Text>
      <Text
        className="mb-8 text-center text-base"
        style={{ color: colors.muted }}
      >
        Welcome, {name}
      </Text>

      <Pressable
        className="w-full max-w-sm rounded-lg px-5 py-3"
        style={{ backgroundColor: colors.primary }}
        onPress={() => void authClient.signOut()}
      >
        <Text
          className="text-center font-semibold"
          style={{ color: colors.primaryForeground }}
        >
          Sign out
        </Text>
      </Pressable>
    </View>
  );
}
