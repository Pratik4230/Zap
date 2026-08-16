/** Free plan: max active links a user can have at once. */
export const FREE_MAX_ACTIVE_LINKS = 50;

/** Pro plan: max active links a user can have at once. */
export const PRO_MAX_ACTIVE_LINKS = 500;

/** Free plan: max tracked link visits per calendar month (UTC), workspace-wide. */
export const FREE_MAX_TRACKED_CLICKS_PER_MONTH = 5_000;

/** Pro plan: max tracked link visits per calendar month (UTC), workspace-wide. */
export const PRO_MAX_TRACKED_CLICKS_PER_MONTH = 50_000;

/** Business plan: max tracked link visits per calendar month (UTC), workspace-wide. */
export const BUSINESS_MAX_TRACKED_CLICKS_PER_MONTH = 1_000_000;

/** Business plan: max members including the owner. */
export const BUSINESS_MAX_TEAM_SEATS = 50;

/** Hard cap: workspaces one account can own (create). */
export const BUSINESS_MAX_OWNED_WORKSPACES = 30;

/** Hard cap: workspaces one account can belong to (owned + invited). */
export const MAX_WORKSPACE_MEMBERSHIPS = 100;

/** Free plan: analytics history window in days. */
export const FREE_ANALYTICS_HISTORY_DAYS = 7;

/** Pro plan: analytics history window in days. */
export const PRO_ANALYTICS_HISTORY_DAYS = 365;

/** Business plan: analytics history window in days (3 years). */
export const BUSINESS_ANALYTICS_HISTORY_DAYS = 1095;

/** Paid plans: daily chart bar count (full history used for breakdowns). */
export const PRO_ANALYTICS_CHART_DAYS = 30;

/** Paid plans: default chart range when no query param is set. */
export const PRO_ANALYTICS_DEFAULT_RANGE_DAYS = 30;

export const PRO_ANALYTICS_RANGE_OPTIONS = [7, 30, 90, 365] as const;
export const BUSINESS_ANALYTICS_RANGE_OPTIONS = [7, 30, 90, 365, 1095] as const;

export type AnalyticsRangeDays =
  (typeof BUSINESS_ANALYTICS_RANGE_OPTIONS)[number];

export type WorkspacePlan = "free" | "pro" | "business";

export function isWorkspacePlan(
  value: string | null | undefined,
): value is WorkspacePlan {
  return value === "free" || value === "pro" || value === "business";
}

export function isPaidPlan(plan: WorkspacePlan): boolean {
  return plan === "pro" || plan === "business";
}

export function getUtcMonthKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function monthlyTrackedClicksKey(
  workspaceId: string,
  month = getUtcMonthKey(),
): string {
  return `tracked-clicks:${workspaceId}:${month}`;
}

export function monthlyClickLimitNotifiedKey(
  workspaceId: string,
  month = getUtcMonthKey(),
): string {
  return `click-limit-notified:${workspaceId}:${month}`;
}

export function userPlanCacheKey(userId: string): string {
  return `user-plan:${userId}`;
}

export function workspacePlanCacheKey(workspaceId: string): string {
  return `workspace-plan:${workspaceId}`;
}

export async function getMonthlyTrackedClicks(
  kv: KVNamespace,
  workspaceId: string,
): Promise<number> {
  const raw = await kv.get(monthlyTrackedClicksKey(workspaceId));
  return Number(raw) || 0;
}

export async function incrementMonthlyTrackedClicks(
  kv: KVNamespace,
  workspaceId: string,
): Promise<number> {
  const key = monthlyTrackedClicksKey(workspaceId);
  const current = Number(await kv.get(key)) || 0;
  const next = current + 1;
  await kv.put(key, String(next), { expirationTtl: 60 * 60 * 24 * 35 });
  return next;
}

export function getTrackedClickLimit(plan: WorkspacePlan): number {
  if (plan === "business") return BUSINESS_MAX_TRACKED_CLICKS_PER_MONTH;
  if (plan === "pro") return PRO_MAX_TRACKED_CLICKS_PER_MONTH;
  return FREE_MAX_TRACKED_CLICKS_PER_MONTH;
}

/** Null means unlimited active links. */
export function getMaxActiveLinks(plan: WorkspacePlan): number | null {
  if (plan === "business") return null;
  if (plan === "pro") return PRO_MAX_ACTIVE_LINKS;
  return FREE_MAX_ACTIVE_LINKS;
}

export function getAnalyticsHistoryDays(plan: WorkspacePlan): number {
  if (plan === "business") return BUSINESS_ANALYTICS_HISTORY_DAYS;
  if (plan === "pro") return PRO_ANALYTICS_HISTORY_DAYS;
  return FREE_ANALYTICS_HISTORY_DAYS;
}

export function getAnalyticsChartDays(plan: WorkspacePlan): number {
  return isPaidPlan(plan)
    ? PRO_ANALYTICS_CHART_DAYS
    : FREE_ANALYTICS_HISTORY_DAYS;
}

export function getAnalyticsRangeOptions(
  plan: WorkspacePlan,
): readonly number[] {
  if (plan === "business") return BUSINESS_ANALYTICS_RANGE_OPTIONS;
  if (plan === "pro") return PRO_ANALYTICS_RANGE_OPTIONS;
  return [FREE_ANALYTICS_HISTORY_DAYS];
}

export function analyticsHistoryStart(
  plan: WorkspacePlan,
  now = new Date(),
): Date {
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
  if (days === 1095) return "Last 3 years";
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
  if (days === 1095) return "Last 3 years";
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
  requestedDays: number | null,
): AnalyticsRangeDays {
  const maxDays = getAnalyticsHistoryDays(plan);
  const allowed = getAnalyticsRangeOptions(plan);

  if (
    requestedDays &&
    allowed.includes(requestedDays) &&
    requestedDays <= maxDays
  ) {
    return requestedDays as AnalyticsRangeDays;
  }

  return isPaidPlan(plan)
    ? PRO_ANALYTICS_DEFAULT_RANGE_DAYS
    : FREE_ANALYTICS_HISTORY_DAYS;
}

export function analyticsRangeStart(rangeDays: number, now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (rangeDays - 1));
  return start;
}

export type AnalyticsChartBucket = "day" | "week" | "month";

export function getAnalyticsChartBucket(
  rangeDays: number,
): AnalyticsChartBucket {
  if (rangeDays <= 90) return "day";
  return "month";
}
