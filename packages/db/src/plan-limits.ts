/** Free plan: max active links a user can have at once. */
export const FREE_MAX_ACTIVE_LINKS = 50;

/** Pro plan: max active links a user can have at once. */
export const PRO_MAX_ACTIVE_LINKS = 500;

/** Free plan: max tracked link visits per calendar month (UTC), account-wide. */
export const FREE_MAX_TRACKED_CLICKS_PER_MONTH = 5_000;

/** Pro plan: max tracked link visits per calendar month (UTC), account-wide. */
export const PRO_MAX_TRACKED_CLICKS_PER_MONTH = 50_000;

/** Free plan: analytics history window in days. */
export const FREE_ANALYTICS_HISTORY_DAYS = 7;

/** Pro plan: analytics history window in days. */
export const PRO_ANALYTICS_HISTORY_DAYS = 365;

/** Pro plan: daily chart bar count (full history used for breakdowns + CSV). */
export const PRO_ANALYTICS_CHART_DAYS = 30;

/** Pro plan: default chart range when no query param is set. */
export const PRO_ANALYTICS_DEFAULT_RANGE_DAYS = 30;

export const PRO_ANALYTICS_RANGE_OPTIONS = [7, 30, 90, 365] as const;

export type AnalyticsRangeDays = (typeof PRO_ANALYTICS_RANGE_OPTIONS)[number];

export type WorkspacePlan = "free" | "pro";

export function getUtcMonthKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function monthlyTrackedClicksKey(
  userId: string,
  month = getUtcMonthKey(),
): string {
  return `tracked-clicks:${userId}:${month}`;
}

export function monthlyClickLimitNotifiedKey(
  userId: string,
  month = getUtcMonthKey(),
): string {
  return `click-limit-notified:${userId}:${month}`;
}

export function userPlanCacheKey(userId: string): string {
  return `user-plan:${userId}`;
}

export async function getMonthlyTrackedClicks(
  kv: KVNamespace,
  userId: string,
): Promise<number> {
  const raw = await kv.get(monthlyTrackedClicksKey(userId));
  return Number(raw) || 0;
}

export async function incrementMonthlyTrackedClicks(
  kv: KVNamespace,
  userId: string,
): Promise<number> {
  const key = monthlyTrackedClicksKey(userId);
  const current = Number(await kv.get(key)) || 0;
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl: 60 * 60 * 24 * 35 });
  return next;
}

export function getTrackedClickLimit(plan: WorkspacePlan): number | null {
  if (plan === "pro") return PRO_MAX_TRACKED_CLICKS_PER_MONTH;
  return FREE_MAX_TRACKED_CLICKS_PER_MONTH;
}

export function getMaxActiveLinks(plan: WorkspacePlan): number {
  return plan === "pro" ? PRO_MAX_ACTIVE_LINKS : FREE_MAX_ACTIVE_LINKS;
}

export function getAnalyticsHistoryDays(plan: WorkspacePlan): number {
  return plan === "pro" ? PRO_ANALYTICS_HISTORY_DAYS : FREE_ANALYTICS_HISTORY_DAYS;
}

export function getAnalyticsChartDays(plan: WorkspacePlan): number {
  return plan === "pro" ? PRO_ANALYTICS_CHART_DAYS : FREE_ANALYTICS_HISTORY_DAYS;
}

export function analyticsHistoryStart(plan: WorkspacePlan, now = new Date()): Date {
  const days = getAnalyticsHistoryDays(plan);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  return start;
}

export function formatAnalyticsHistoryLabel(plan: WorkspacePlan): string {
  const days = getAnalyticsHistoryDays(plan);
  if (days === 7) return "Last 7 days";
  if (days === 365) return "Last year";
  return `Last ${days} days`;
}

export function formatAnalyticsChartLabel(plan: WorkspacePlan): string {
  const days = getAnalyticsChartDays(plan);
  if (days === 7) return "Last 7 days";
  if (days === 30) return "Last 30 days";
  return `Last ${days} days`;
}

export function formatAnalyticsRangeLabel(days: number): string {
  if (days === 7) return "Last 7 days";
  if (days === 30) return "Last 30 days";
  if (days === 90) return "Last 90 days";
  if (days === 365) return "Last year";
  return `Last ${days} days`;
}

export function parseAnalyticsRangeParam(value: string | null): number | null {
  if (!value) return null;
  const days = Number(value);
  if (!Number.isInteger(days)) return null;
  return days;
}

export function resolveAnalyticsRange(
  plan: WorkspacePlan,
  requestedDays: number | null
): AnalyticsRangeDays {
  const maxDays = getAnalyticsHistoryDays(plan);
  const allowed =
    plan === "pro" ? [...PRO_ANALYTICS_RANGE_OPTIONS] : [FREE_ANALYTICS_HISTORY_DAYS];

  if (
    requestedDays &&
    allowed.includes(requestedDays as AnalyticsRangeDays) &&
    requestedDays <= maxDays
  ) {
    return requestedDays as AnalyticsRangeDays;
  }

  return plan === "pro" ? PRO_ANALYTICS_DEFAULT_RANGE_DAYS : FREE_ANALYTICS_HISTORY_DAYS;
}

export function analyticsRangeStart(rangeDays: number, now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (rangeDays - 1));
  return start;
}

export type AnalyticsChartBucket = "day" | "week" | "month";

export function getAnalyticsChartBucket(rangeDays: number): AnalyticsChartBucket {
  if (rangeDays <= 90) return "day";
  return "month";
}
