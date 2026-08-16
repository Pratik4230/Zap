import type { WorkspacePlan } from "@/global/api/types";

export function analyticsRangeOptions(plan: WorkspacePlan | undefined): {
  days: number;
  label: string;
}[] {
  const options = [
    { days: 7, label: "7d" },
    { days: 30, label: "30d" },
    { days: 90, label: "90d" },
  ];
  if (plan === "pro" || plan === "business") {
    options.push({ days: 365, label: "1y" });
  }
  if (plan === "business") {
    options.push({ days: 1095, label: "3y" });
  }
  return options;
}

export function clampAnalyticsRange(
  days: number,
  plan: WorkspacePlan | undefined
): number {
  const allowed = analyticsRangeOptions(plan).map((option) => option.days);
  if (allowed.includes(days)) return days;
  return 30;
}
