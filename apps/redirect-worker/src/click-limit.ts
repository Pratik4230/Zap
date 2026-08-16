import {
  clickLimitAccountId,
  getMonthlyTrackedClicks,
  getPlanForLink,
  getTrackedClickLimit,
  getUserEmail,
  getWorkspaceOwnerEmail,
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
  const plan = await getPlanForLink(env.ZAP_CACHE, env.DB, link);
  const limit = getTrackedClickLimit(plan);
  const accountId = clickLimitAccountId(link);
  const current = await getMonthlyTrackedClicks(env.ZAP_CACHE, accountId);
  if (current >= limit) {
    return renderMonthlyClickLimitPage();
  }

  return null;
}

export async function recordTrackedClick(
  env: PlanLimitEnv,
  link: Link
): Promise<number> {
  const accountId = clickLimitAccountId(link);
  const newCount = await incrementMonthlyTrackedClicks(env.ZAP_CACHE, accountId);
  const plan = await getPlanForLink(env.ZAP_CACHE, env.DB, link);
  const limit = getTrackedClickLimit(plan);

  if (newCount === limit) {
    await notifyMonthlyClickLimit(env, link, limit);
  }

  return newCount;
}

async function notifyMonthlyClickLimit(
  env: PlanLimitEnv,
  link: Link,
  limit: number
): Promise<void> {
  const accountId = clickLimitAccountId(link);
  const notifyKey = monthlyClickLimitNotifiedKey(accountId);
  if (await env.ZAP_CACHE.get(notifyKey)) return;

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[click-limit] RESEND_API_KEY not configured; skipping email");
    return;
  }

  const email = link.workspaceId
    ? await getWorkspaceOwnerEmail(env.DB, link.workspaceId)
    : await getUserEmail(env.DB, link.userId);
  if (!email) return;

  try {
    await sendMonthlyClickLimitEmail({ apiKey, to: email, limit });
    await env.ZAP_CACHE.put(notifyKey, "1", { expirationTtl: 60 * 60 * 24 * 35 });
  } catch (error) {
    console.error("[click-limit] failed to send email", error);
  }
}
