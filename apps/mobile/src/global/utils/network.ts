import { useMemo } from "react";
import { useNetworkState, type NetworkState } from "expo-network";

/**
 * Treat unknown reachability as online to avoid banner flicker while Android validates.
 * Only mark offline when connected is false OR internet is explicitly unreachable.
 */
export function isNetworkOnline(state: NetworkState | undefined): boolean {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

/** Live online/offline from `expo-network`. */
export function useIsOnline(): boolean {
  const state = useNetworkState();
  return useMemo(() => isNetworkOnline(state), [state]);
}
