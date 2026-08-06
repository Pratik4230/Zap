import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "@/global/theme";

type AuthPrimaryButtonProps = {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  enabled?: boolean;
  onPress: () => void;
};

/**
 * Full-width primary CTA (RN). Compose Material Button ignores fillMaxWidth
 * under Host matchContents — use this so Sign in / Sign up match Google.
 */
export function AuthPrimaryButton({
  label,
  loadingLabel,
  loading = false,
  enabled = true,
  onPress,
}: AuthPrimaryButtonProps) {
  const disabled = !enabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.label}>
        {loading ? (loadingLabel ?? label) : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
});
