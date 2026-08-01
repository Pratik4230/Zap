/**
 * Workers-safe Expo Push sender (plain HTTP — no Node SDK).
 * Same API as https://docs.expo.dev/push-notifications/sending-notifications/
 * Use `expo-server-sdk` from apps/web when running on Node.
 */
export type ExpoPushHttpMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
};

export function isExpoPushToken(token: string): boolean {
  return (
    typeof token === "string" &&
    (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))
  );
}

export async function sendExpoPushHttp(
  messages: ExpoPushHttpMessage[]
): Promise<void> {
  const valid = messages.filter((m) => isExpoPushToken(m.to));
  if (valid.length === 0) return;

  // Expo accepts a single object or an array.
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(valid),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Expo push HTTP ${response.status}: ${text.slice(0, 200)}`);
  }
}
