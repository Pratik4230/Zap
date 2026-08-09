import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const PREF_KEY = "xaply_biometric_unlock";

export type BiometricCapability = {
  hardware: boolean;
  enrolled: boolean;
  available: boolean;
  label: string;
};

/** Human label from enrolled auth types (Android-first). */
export async function getBiometricCapability(): Promise<BiometricCapability> {
  const hardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = hardware
    ? await LocalAuthentication.isEnrolledAsync()
    : false;
  const types = hardware
    ? await LocalAuthentication.supportedAuthenticationTypesAsync()
    : [];

  const hasFace = types.includes(
    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
  );
  const hasFinger = types.includes(
    LocalAuthentication.AuthenticationType.FINGERPRINT,
  );
  const hasIris = types.includes(LocalAuthentication.AuthenticationType.IRIS);

  let label = "Biometrics";
  if (hasFinger && !hasFace && !hasIris) label = "Fingerprint";
  else if (hasFace && !hasFinger && !hasIris) label = "Face unlock";
  else if (hasFinger || hasFace || hasIris) label = "Biometrics";

  return {
    hardware,
    enrolled,
    available: hardware && enrolled,
    label,
  };
}

export async function isBiometricUnlockEnabled(): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(PREF_KEY);
    return value === "1";
  } catch {
    return false;
  }
}

export async function setBiometricUnlockEnabled(
  enabled: boolean,
): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(PREF_KEY, "1");
  } else {
    await SecureStore.deleteItemAsync(PREF_KEY);
  }
}

export async function clearBiometricUnlockPreference(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PREF_KEY);
  } catch {
    // ignore
  }
}

export async function authenticateBiometric(promptMessage: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const capability = await getBiometricCapability();
  if (!capability.available) {
    return {
      success: false,
      error: capability.hardware
        ? "No biometrics enrolled on this device."
        : "Biometrics aren’t available on this device.",
    };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });

  if (result.success) return { success: true };

  if (result.error === "user_cancel" || result.error === "system_cancel") {
    return { success: false, error: "Cancelled" };
  }
  if (result.error === "lockout") {
    return {
      success: false,
      error: "Too many attempts. Try again later or use device PIN.",
    };
  }
  return {
    success: false,
    error: result.warning || "Authentication failed",
  };
}
