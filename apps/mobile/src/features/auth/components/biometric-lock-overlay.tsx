import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { useBiometricUnlock } from "@/features/auth/components/biometric-unlock-provider";
import { brand, colors } from "@/global/theme";

/**
 * Full-screen lock when biometric app unlock is enabled.
 * Renders over authenticated routes only (mounted under (app)).
 */
export function BiometricLockOverlay() {
  const { ready, enabled, locked, unlock, capability } = useBiometricUnlock();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !enabled || !locked) return;
    let cancelled = false;
    setError("");
    setBusy(true);
    void (async () => {
      const result = await unlock();
      if (cancelled) return;
      if (!result.ok && result.message && result.message !== "Cancelled") {
        setError(result.message);
      }
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, enabled, locked, unlock]);

  if (!ready || !enabled || !locked) return null;

  async function onUnlock() {
    setBusy(true);
    setError("");
    const result = await unlock();
    if (!result.ok && result.message && result.message !== "Cancelled") {
      setError(result.message);
    }
    setBusy(false);
  }

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <Text style={styles.brand}>{brand.name}</Text>
      <Text style={styles.title}>App locked</Text>
      <Text style={styles.subtitle}>
        Use {capability.label.toLowerCase()} to continue
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.cta}>
        <AuthPrimaryButton
          label={`Unlock with ${capability.label.toLowerCase()}`}
          loadingLabel="Waiting…"
          loading={busy}
          enabled={!busy}
          onPress={() => void onUnlock()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
    backgroundColor: colors.background,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brand: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  title: {
    color: colors.foreground,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 24,
  },
  error: {
    color: colors.destructive,
    fontSize: 13,
    marginBottom: 16,
  },
  cta: {
    width: "100%",
  },
});
