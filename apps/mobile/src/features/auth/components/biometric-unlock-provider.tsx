import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  authenticateBiometric,
  clearBiometricUnlockPreference,
  getBiometricCapability,
  isBiometricUnlockEnabled,
  setBiometricUnlockEnabled,
  type BiometricCapability,
} from "@/features/auth/utils/biometric";

type BiometricUnlockContextValue = {
  ready: boolean;
  capability: BiometricCapability;
  enabled: boolean;
  locked: boolean;
  unlock: () => Promise<{ ok: boolean; message?: string }>;
  enable: () => Promise<{ ok: boolean; message?: string }>;
  disable: () => Promise<{ ok: boolean; message?: string }>;
};

const BiometricUnlockContext =
  createContext<BiometricUnlockContextValue | null>(null);

const DEFAULT_CAPABILITY: BiometricCapability = {
  hardware: false,
  enrolled: false,
  available: false,
  label: "Biometrics",
};

export function BiometricUnlockProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [capability, setCapability] =
    useState<BiometricCapability>(DEFAULT_CAPABILITY);
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const authenticatingRef = useRef(false);
  const enabledRef = useRef(false);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [cap, on] = await Promise.all([
        getBiometricCapability(),
        isBiometricUnlockEnabled(),
      ]);
      if (cancelled) return;
      setCapability(cap);
      setEnabled(on);
      setLocked(on && cap.available);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onChange(next: AppStateStatus) {
      if (next === "background" && enabledRef.current && !authenticatingRef.current) {
        setLocked(true);
      }
    }
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  const unlock = useCallback(async () => {
    if (authenticatingRef.current) {
      return { ok: false, message: "Already prompting…" };
    }
    authenticatingRef.current = true;
    try {
      const result = await authenticateBiometric("Unlock Xaply");
      if (result.success) {
        setLocked(false);
        return { ok: true };
      }
      return { ok: false, message: result.error };
    } finally {
      authenticatingRef.current = false;
    }
  }, []);

  const enable = useCallback(async () => {
    const cap = await getBiometricCapability();
    setCapability(cap);
    if (!cap.available) {
      return {
        ok: false,
        message: cap.hardware
          ? "Enroll a fingerprint or face unlock in system settings first."
          : "Biometrics aren’t available on this device.",
      };
    }
    authenticatingRef.current = true;
    try {
      const result = await authenticateBiometric("Enable app lock");
      if (!result.success) {
        return { ok: false, message: result.error };
      }
      await setBiometricUnlockEnabled(true);
      setEnabled(true);
      setLocked(false);
      return { ok: true };
    } finally {
      authenticatingRef.current = false;
    }
  }, []);

  const disable = useCallback(async () => {
    authenticatingRef.current = true;
    try {
      const result = await authenticateBiometric("Disable app lock");
      if (!result.success) {
        return { ok: false, message: result.error };
      }
      await clearBiometricUnlockPreference();
      setEnabled(false);
      setLocked(false);
      return { ok: true };
    } finally {
      authenticatingRef.current = false;
    }
  }, []);

  const value = useMemo(
    () => ({
      ready,
      capability,
      enabled,
      locked,
      unlock,
      enable,
      disable,
    }),
    [ready, capability, enabled, locked, unlock, enable, disable],
  );

  return (
    <BiometricUnlockContext.Provider value={value}>
      {children}
    </BiometricUnlockContext.Provider>
  );
}

export function useBiometricUnlock(): BiometricUnlockContextValue {
  const ctx = useContext(BiometricUnlockContext);
  if (!ctx) {
    throw new Error("useBiometricUnlock must be used within BiometricUnlockProvider");
  }
  return ctx;
}
