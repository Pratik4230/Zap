import { and, eq } from "drizzle-orm";
import { createDb } from "./db";
import { workspaceWebhooks, workspaces } from "./schema";
import { effectiveWorkspacePlan } from "./plan";
import { logError } from "./observability";

export const WEBHOOK_EVENTS = [
  "link.created",
  "link.updated",
  "link.deleted",
  "link.clicked",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export function isWebhookEvent(value: string): value is WebhookEvent {
  return (WEBHOOK_EVENTS as readonly string[]).includes(value);
}

export function parseWebhookEvents(raw: string): WebhookEvent[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...WEBHOOK_EVENTS];
    return parsed.filter((item): item is WebhookEvent => typeof item === "string" && isWebhookEvent(item));
  } catch {
    return [...WEBHOOK_EVENTS];
  }
}

export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type WebhookPayload = {
  event: WebhookEvent;
  createdAt: string;
  workspaceId: string;
  data: Record<string, unknown>;
};

async function postWebhook(
  url: string,
  secret: string,
  body: string
): Promise<{ ok: boolean; error?: string }> {
  const signature = await hmacSha256Hex(secret, body);
  const delays = [0, 400, 1200];

  let lastError = "Delivery failed";
  for (const delay of delays) {
    if (delay) await sleep(delay);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-xaply-signature": `sha256=${signature}`,
          "user-agent": "Xaply-Webhooks/1.0",
        },
        body,
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) return { ok: true };
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Network error";
    }
  }

  return { ok: false, error: lastError };
}

export async function deliverWorkspaceWebhooks(
  db: D1Database,
  workspaceId: string | null | undefined,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  if (!workspaceId) return;

  const drizzle = createDb(db);
  const [workspace] = await drizzle
    .select({ plan: workspaces.plan, proGrantedUntil: workspaces.proGrantedUntil })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!workspace || effectiveWorkspacePlan(workspace) !== "business") return;

  const hooks = await drizzle
    .select()
    .from(workspaceWebhooks)
    .where(
      and(eq(workspaceWebhooks.workspaceId, workspaceId), eq(workspaceWebhooks.enabled, true))
    );

  if (hooks.length === 0) return;

  const payload: WebhookPayload = {
    event,
    createdAt: new Date().toISOString(),
    workspaceId,
    data,
  };
  const body = JSON.stringify(payload);

  for (const hook of hooks) {
    const events = parseWebhookEvents(hook.events);
    if (!events.includes(event)) continue;

    const result = await postWebhook(hook.url, hook.secret, body);
    await drizzle
      .update(workspaceWebhooks)
      .set({
        lastDeliveredAt: result.ok ? new Date() : hook.lastDeliveredAt,
        lastError: result.ok ? null : result.error ?? "Delivery failed",
        updatedAt: new Date(),
      })
      .where(eq(workspaceWebhooks.id, hook.id));

    if (!result.ok) {
      logError("webhook.delivery_failed", result.error, {
        webhookId: hook.id,
        workspaceId,
        event,
      });
    }
  }
}
