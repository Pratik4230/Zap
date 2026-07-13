import {
  FREE_MAX_TRACKED_CLICKS_PER_MONTH,
  getMonthlyTrackedClicks,
  getTrackedClickLimit,
  getUserEmail,
  getUserPlanCached,
  incrementMonthlyTrackedClicks,
  monthlyClickLimitNotifiedKey,
  sendMonthlyClickLimitEmail,
  type Link,
} from "@xaply/db";
import { renderMonthlyClickLimitPage } from "./plan-limit-page";

interface PlanLimitEnv {
  ZAP_CACHE: KVNamespace;
  DB: D1Database;
  RESEND_API_KEY?: string;
}

export async function enforceMonthlyClickLimit(
  env: PlanLimitEnv,
  link: Link
): Promise<Response | null> {
  const plan = await getUserPlanCached(env.ZAP_CACHE, env.DB, link.userId);
  const limit = getTrackedClickLimit(plan);
  if (limit == null) return null;

  const current = await getMonthlyTrackedClicks(env.ZAP_CACHE, link.userId);
  if (current >= limit) {
    return renderMonthlyClickLimitPage();
  }

  return null;
}

export async function recordTrackedClick(
  env: PlanLimitEnv,
  link: Link
): Promise<number> {
  const newCount = await incrementMonthlyTrackedClicks(env.ZAP_CACHE, link.userId);
  const plan = await getUserPlanCached(env.ZAP_CACHE, env.DB, link.userId);
  const limit = getTrackedClickLimit(plan) ?? FREE_MAX_TRACKED_CLICKS_PER_MONTH;

  if (newCount === limit) {
    await notifyMonthlyClickLimit(env, link.userId, limit);
  }

  return newCount;
}

async function notifyMonthlyClickLimit(
  env: PlanLimitEnv,
  userId: string,
  limit: number
): Promise<void> {
  const notifyKey = monthlyClickLimitNotifiedKey(userId);
  if (await env.ZAP_CACHE.get(notifyKey)) return;

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[click-limit] RESEND_API_KEY not configured; skipping email");
    return;
  }

  const email = await getUserEmail(env.DB, userId);
  if (!email) return;

  try {
    await sendMonthlyClickLimitEmail({ apiKey, to: email, limit });
    await env.ZAP_CACHE.put(notifyKey, "1", { expirationTtl: 60 * 60 * 24 * 35 });
  } catch (error) {
    console.error("[click-limit] failed to send email", error);
  }
}
