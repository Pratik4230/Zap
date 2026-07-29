import { APP_URL } from "./constants";
import { sendDowntimeAlertEmail, sendRecoveryAlertEmail } from "./alert-email";
import { logError, logEvent } from "./observability";

export interface HealthCheckResult {
  service: string;
  ok: boolean;
  status?: number;
  latencyMs?: number;
  error?: string;
}

export interface HealthMonitorEnv {
  DB: D1Database;
  ZAP_CACHE: KVNamespace;
  RESEND_API_KEY?: string;
  ADMIN_EMAIL?: string;
}

const ALERT_COOLDOWN_SECONDS = 15 * 60;

export function healthAlertKey(service: string): string {
  return `health-alert:${service}`;
}

export async function checkWebHealth(
  appUrl = APP_URL,
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${appUrl}/api/health`, {
      signal: AbortSignal.timeout(10_000),
    });
    return {
      service: "web",
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - start,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (error) {
    return {
      service: "web",
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function checkD1Health(
  db: D1Database,
): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await db.prepare("SELECT 1 AS ok").first();
    return { service: "d1", ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      service: "d1",
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function checkKvHealth(
  kv: KVNamespace,
): Promise<HealthCheckResult> {
  const start = Date.now();
  const key = `health-probe:${Date.now()}`;
  try {
    await kv.put(key, "1", { expirationTtl: 60 });
    const value = await kv.get(key);
    await kv.delete(key);
    return {
      service: "kv",
      ok: value === "1",
      latencyMs: Date.now() - start,
      error: value === "1" ? undefined : "KV read/write mismatch",
    };
  } catch (error) {
    return {
      service: "kv",
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runHealthChecks(
  env: Pick<HealthMonitorEnv, "DB" | "ZAP_CACHE">,
  appUrl = APP_URL,
): Promise<HealthCheckResult[]> {
  const [web, d1, kv] = await Promise.all([
    checkWebHealth(appUrl),
    checkD1Health(env.DB),
    checkKvHealth(env.ZAP_CACHE),
  ]);
  return [web, d1, kv];
}

function formatCheckDetails(result: HealthCheckResult): string {
  const parts = [
    result.error ? `Error: ${result.error}` : null,
    result.status != null ? `Status: ${result.status}` : null,
    result.latencyMs != null ? `Latency: ${result.latencyMs}ms` : null,
  ].filter(Boolean);
  return parts.join("<br/>") || "Health check failed.";
}

export async function processHealthAlerts(
  env: HealthMonitorEnv,
  results: HealthCheckResult[],
  appUrl = APP_URL,
): Promise<void> {
  const adminEmail = env.ADMIN_EMAIL?.trim();
  const apiKey = env.RESEND_API_KEY;
  if (!adminEmail || !apiKey) {
    logEvent({
      event: "health.alert_skipped",
      level: "warn",
      reason: "missing_admin_email_or_resend_key",
    });
    return;
  }

  for (const result of results) {
    const alertKey = healthAlertKey(result.service);
    const wasAlerted = await env.ZAP_CACHE.get(alertKey);

    if (!result.ok) {
      if (wasAlerted) continue;

      try {
        await sendDowntimeAlertEmail({
          apiKey,
          to: adminEmail,
          service: result.service,
          details: formatCheckDetails(result),
          appUrl,
        });
        await env.ZAP_CACHE.put(alertKey, new Date().toISOString(), {
          expirationTtl: ALERT_COOLDOWN_SECONDS,
        });
        logEvent({
          event: "health.alert_sent",
          level: "warn",
          service: result.service,
          details: formatCheckDetails(result),
        });
      } catch (error) {
        logError("health.alert_failed", error, { service: result.service });
      }
      continue;
    }

    if (!wasAlerted) continue;

    try {
      await sendRecoveryAlertEmail({
        apiKey,
        to: adminEmail,
        service: result.service,
        appUrl,
      });
      await env.ZAP_CACHE.delete(alertKey);
      logEvent({
        event: "health.recovery_sent",
        service: result.service,
      });
    } catch (error) {
      logError("health.recovery_failed", error, { service: result.service });
    }
  }
}

export async function runHealthMonitor(
  env: HealthMonitorEnv,
  appUrl = APP_URL,
): Promise<HealthCheckResult[]> {
  const results = await runHealthChecks(env, appUrl);
  await processHealthAlerts(env, results, appUrl);
  return results;
}
