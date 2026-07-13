"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeProButton } from "@/components/billing/upgrade-pro-button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AMBER = "oklch(0.769 0.188 70.08)";

type BillingPlan = "free" | "pro";

async function fetchBillingPlan(): Promise<BillingPlan> {
  const res = await fetch("/api/billing");
  if (!res.ok) throw new Error("Could not load billing plan");
  const data = (await res.json()) as { plan: BillingPlan };
  return data.plan;
}

function planLabel(plan: BillingPlan): string {
  return plan === "pro" ? "Pro" : "Free";
}

export function BillingSettingsCard() {
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ["billing"],
    queryFn: fetchBillingPlan,
  });

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { data, error } = await authClient.dodopayments.customer.portal();
      if (error) throw new Error(error.message ?? "Could not open billing portal");
      if (!data?.url) throw new Error("Billing portal URL missing");
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open billing portal");
      setPortalLoading(false);
    }
  }

  const isPro = plan === "pro";

  return (
    <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
      <CardHeader className="px-6 pt-5 pb-4">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <CreditCard size={16} style={{ color: AMBER }} />
          Billing
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {isPro
            ? "Manage your Pro subscription via Dodo Payments"
            : "Upgrade to Pro or manage billing via Dodo Payments"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/3 px-4 py-3">
          <span className="text-sm text-muted-foreground">Current plan</span>
          {isLoading ? (
            <span className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
          ) : isError ? (
            <span className="text-sm text-muted-foreground">Unavailable</span>
          ) : (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                isPro ? "text-black" : "border border-white/10 bg-white/5 text-foreground",
              )}
              style={isPro ? { background: AMBER } : undefined}
            >
              {planLabel(plan ?? "free")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {!isPro && <UpgradeProButton className="h-10 rounded-lg px-4" label="Upgrade to Pro" />}
          <button
            type="button"
            onClick={openPortal}
            disabled={portalLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            {portalLoading ? <Loader2 className="size-4 animate-spin" /> : "Manage subscription"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
