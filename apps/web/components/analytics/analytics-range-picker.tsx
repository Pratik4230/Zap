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
] as const;

type AnalyticsRangePickerProps = {
  value: number;
  plan: "free" | "pro";
  onChange: (days: number) => void;
  className?: string;
};

export function AnalyticsRangePicker({
  value,
  plan,
  onChange,
  className,
}: AnalyticsRangePickerProps) {
  const isPro = plan === "pro";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="inline-flex rounded-lg border border-white/10 bg-white/3 p-1">
        {RANGE_OPTIONS.map((option) => {
          const locked = !isPro && option.days !== 7;
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
                  ? "Upgrade to Pro for longer analytics history"
                  : `Show ${option.label} of data`
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {!isPro ? (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 border-white/10 bg-white/5 text-xs hover:bg-white/10"
        >
          <Link href="/settings">Unlock 1 year on Pro</Link>
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">Pro: up to 1 year of history</span>
      )}
    </div>
  );
}
