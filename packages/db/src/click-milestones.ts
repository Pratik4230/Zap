/**
 * Per-link click milestones that trigger a push to the link owner.
 * Keep sorted ascending — used for threshold crossing checks.
 */
export const CLICK_MILESTONES = [
  10, 25, 50, 100, 200, 500, 1000, 5000, 10_000, 25_000, 50_000, 100_000,
] as const;

export type ClickMilestone = (typeof CLICK_MILESTONES)[number];

/**
 * Milestones strictly after `previousCount` and at most `newCount`
 * (e.g. 9 → 10 crosses 10; 9 → 26 crosses 10 and 25).
 */
export function milestonesCrossed(
  previousCount: number,
  newCount: number
): ClickMilestone[] {
  if (newCount <= previousCount) return [];
  return CLICK_MILESTONES.filter(
    (m) => m > previousCount && m <= newCount
  ) as ClickMilestone[];
}

export function formatClickMilestone(n: number): string {
  return n.toLocaleString("en-US");
}
