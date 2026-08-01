import Toast from "react-native-toast-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastKind = "success" | "error";

/**
 * App toast helper — backs onto react-native-toast-message (top position).
 */
export function toast(message: string, kind: ToastKind = "success") {
  Toast.show({
    type: kind === "error" ? "error" : "success",
    text1: message,
    position: "top",
    visibilityTime: kind === "error" ? 4000 : 2500,
  });
}

/** Root toast host — offsets below the status / camera inset. */
export function ToastRoot() {
  const insets = useSafeAreaInsets();
  return <Toast topOffset={Math.max(insets.top, 12) + 8} />;
}
