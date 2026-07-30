import { onlineManager, focusManager } from "@tanstack/react-query";
import { AppState, type AppStateStatus, Platform } from "react-native";
import * as Network from "expo-network";
import { isNetworkOnline } from "@/global/utils/network";

/**
 * Pause TanStack Query while offline; resume + refetch when connectivity returns.
 * @see https://tanstack.com/query/latest/docs/framework/react/react-native
 */
export function setupQueryConnectivity() {
  onlineManager.setEventListener((setOnline) => {
    const apply = (state: Network.NetworkState) => {
      setOnline(isNetworkOnline(state));
    };

    void Network.getNetworkStateAsync().then(apply);

    const subscription = Network.addNetworkStateListener(apply);
    return () => subscription.remove();
  });

  if (Platform.OS === "web") return;

  focusManager.setEventListener((handleFocus) => {
    const onChange = (status: AppStateStatus) => {
      handleFocus(status === "active");
    };

    const subscription = AppState.addEventListener("change", onChange);
    return () => subscription.remove();
  });
}
