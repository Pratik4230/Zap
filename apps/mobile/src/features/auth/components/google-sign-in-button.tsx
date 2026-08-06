import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { signInWithGoogle } from "@/features/auth/utils/google-sign-in";
import { colors } from "@/global/theme";

type GoogleSignInButtonProps = {
  enabled?: boolean;
  onError?: (message: string) => void;
  onBusyChange?: (busy: boolean) => void;
};

/** Official multicolor Google "G" mark (24×24 viewBox). */
function GoogleLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

/**
 * Full-width Google OAuth button (RN) — logo + label, sits outside Compose Host.
 */
export function GoogleSignInButton({
  enabled = true,
  onError,
  onBusyChange,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const disabled = !enabled || loading;

  async function onPress() {
    if (disabled) return;
    setLoading(true);
    onBusyChange?.(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) onError?.(error);
    } finally {
      setLoading(false);
      onBusyChange?.(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        disabled={disabled}
        onPress={() => void onPress()}
        style={({ pressed }) => [
          styles.button,
          pressed && !disabled && styles.buttonPressed,
          disabled && styles.buttonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#1f1f1f" />
        ) : (
          <>
            <View style={styles.logoSlot}>
              <GoogleLogo />
            </View>
            <Text style={styles.label}>Continue with Google</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    marginTop: 4,
    gap: 14,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  dividerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "500",
  },
  button: {
    width: "100%",
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 12,
  },
  buttonPressed: {
    backgroundColor: "#f2f2f2",
    opacity: 0.96,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  logoSlot: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#1f1f1f",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
});
