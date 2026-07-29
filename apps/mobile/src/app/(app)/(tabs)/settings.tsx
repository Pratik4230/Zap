import { Button, Column, Text } from "@expo/ui/jetpack-compose";
import { fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers";
import { authClient } from "@/auth/client";
import { colors } from "@/theme";
import { AppScreen } from "@/components/app/app-screen";

export default function SettingsTabScreen() {
  const { data: session } = authClient.useSession();
  const name = session?.user?.name ?? session?.user?.email ?? "Account";

  return (
    <AppScreen
      title="Settings"
      subtitle="Profile, plan, and account controls."
    >
      <Column verticalArrangement={{ spacedBy: 16 }}>
        <Text color={colors.foreground} style={{ fontSize: 16 }}>
          Signed in as {name}
        </Text>

        <Button
          modifiers={[fillMaxWidth()]}
          onClick={() => void authClient.signOut()}
          colors={{
            containerColor: colors.primary,
            contentColor: colors.primaryForeground,
          }}
        >
          <Text style={{ fontWeight: "600" }}>Sign out</Text>
        </Button>
      </Column>
    </AppScreen>
  );
}
