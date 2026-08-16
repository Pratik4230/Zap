"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AMBER = "oklch(0.769 0.188 70.08)";

const RANGE_OPTIONS = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
  { days: 365, label: "1Y" },
  { days: 1095, label: "3Y" },
] as const;

type Plan = "free" | "pro" | "business";

type AnalyticsRangePickerProps = {
  value: number;
  plan: Plan;
  onChange: (days: number) => void;
  className?: string;
};

function maxHistoryDays(plan: Plan): number {
  if (plan === "business") return 1095;
  if (plan === "pro") return 365;
  return 7;
}

export function AnalyticsRangePicker({
  value,
  plan,
  onChange,
  className,
}: AnalyticsRangePickerProps) {
  const maxDays = maxHistoryDays(plan);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="inline-flex rounded-lg border border-white/10 bg-white/3 p-1">
        {RANGE_OPTIONS.map((option) => {
          const locked = option.days > maxDays;
          const selected = value === option.days;

          return (
            <button
              key={option.days}
              type="button"
              disabled={locked}
              onClick={() => {
                if (!locked) onChange(option.days);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                selected && "text-black",
                !selected && !locked && "text-muted-foreground hover:text-foreground",
                locked && "cursor-not-allowed text-muted-foreground/40"
              )}
              style={selected ? { background: AMBER } : undefined}
              title={
                locked
                  ? plan === "pro"
                    ? "Upgrade to Business for 3-year analytics"
                    : "Upgrade for longer analytics history"
                  : `Show ${option.label} of data`
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {plan === "free" ? (
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link href="/settings">Upgrade</Link>
        </Button>
      ) : null}
    </div>
  );
}
