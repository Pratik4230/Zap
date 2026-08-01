import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { isExpoPushToken, logError, logEvent } from "@xaply/db";

export type ExpoPushPayload = {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

const expo = new Expo();

/**
 * Send via Expo Push Service using the official Node SDK.
 * Prefer this from Next.js / Node. Analytics worker uses HTTP fetch instead.
 *
 * Note: do not use `Expo.isExpoPushToken` as a TS type guard — in SDK 7
 * `ExpoPushToken` is typed as `string`, so a failed guard narrows to `never`.
 *
 * @see https://docs.expo.dev/push-notifications/sending-notifications/
 * @see https://github.com/expo/expo-server-sdk-node
 */
export async function sendExpoPush(
  messages: ExpoPushPayload[]
): Promise<ExpoPushTicket[]> {
  const pushMessages: ExpoPushMessage[] = [];

  for (const message of messages) {
    const tokens = Array.isArray(message.to) ? message.to : [message.to];
    for (const token of tokens) {
      if (!isExpoPushToken(token)) {
        logError("push.invalid_token", new Error("Not an Expo push token"), {
          tokenPrefix: token.slice(0, 24),
        });
        continue;
      }
      pushMessages.push({
        to: token,
        title: message.title,
        body: message.body,
        data: message.data,
        sound: message.sound ?? "default",
      });
    }
  }

  if (pushMessages.length === 0) return [];

  const tickets: ExpoPushTicket[] = [];
  const chunks = expo.chunkPushNotifications(pushMessages);

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      logError("push.send_chunk_failed", error, { size: chunk.length });
    }
  }

  logEvent({
    event: "push.sent",
    messages: pushMessages.length,
    tickets: tickets.length,
    worker: "xaply",
  });
  return tickets;
}

export { Expo };
