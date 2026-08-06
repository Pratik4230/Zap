import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/global/theme";

type AuthSwitchLinkProps = {
  prompt?: string;
  actionLabel: string;
  enabled?: boolean;
  onPress: () => void;
};

/** “Don’t have an account? Sign up” style link under auth footers. */
export function AuthSwitchLink({
  prompt,
  actionLabel,
  enabled = true,
  onPress,
}: AuthSwitchLinkProps) {
  return (
    <View style={styles.row}>
      {prompt ? <Text style={styles.prompt}>{prompt}</Text> : null}
      <Pressable
        disabled={!enabled}
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="link"
        accessibilityLabel={actionLabel}
      >
        <Text style={[styles.action, !enabled && styles.disabled]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  prompt: {
    color: colors.muted,
    fontSize: 14,
  },
  action: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
});
