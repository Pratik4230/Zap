import { healthAlertKey, sendDowntimeAlertEmail, APP_URL, logError, logEvent } from "@xaply/db";
import { NextResponse } from "next/server";

const API_ALERT_COOLDOWN_SECONDS = 10 * 60;

export async function withApiHandler(
  env: CloudflareEnv,
  route: string,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    logError("api.unhandled_error", error, { route, worker: "xaply" });
    void notifyApiFailure(env, route, error).catch((alertError) => {
      logError("api.alert_failed", alertError, { route, worker: "xaply" });
    });

    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }
}

async function notifyApiFailure(
  env: CloudflareEnv,
  route: string,
  error: unknown
): Promise<void> {
  const adminEmail = env.ADMIN_EMAIL?.trim();
  const apiKey = env.RESEND_API_KEY;
  if (!adminEmail || !apiKey) return;

  const service = `api:${route}`;
  const alertKey = healthAlertKey(service);
  if (await env.ZAP_CACHE.get(alertKey)) return;

  const details =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";

  await sendDowntimeAlertEmail({
    apiKey,
    to: adminEmail,
    service,
    details: `Unhandled API error on <strong style="color:#fafafa;">${route}</strong>.<br/><br/>${details}`,
    appUrl: APP_URL,
  });

  await env.ZAP_CACHE.put(alertKey, new Date().toISOString(), {
    expirationTtl: API_ALERT_COOLDOWN_SECONDS,
  });

  logEvent({
    event: "api.alert_sent",
    level: "warn",
    worker: "xaply",
    route,
    service,
  });
}
