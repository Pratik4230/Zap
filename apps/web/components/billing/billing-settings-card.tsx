"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradePlanButton } from "@/components/billing/upgrade-pro-button";
import { BoltPillSkeleton } from "@/components/ui/bolt-skeleton";
import { authClient } from "@/lib/auth-client";
import { apiJson } from "@/lib/api-fetch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { WorkspacePlan } from "@xaply/db";

const AMBER = "oklch(0.769 0.188 70.08)";

type BillingResponse = {
  plan: WorkspacePlan;
  businessCheckout: boolean;
};

async function fetchBilling(): Promise<BillingResponse> {
  return apiJson<BillingResponse>("/api/billing");
}

function planLabel(plan: WorkspacePlan): string {
  if (plan === "business") return "Business";
  if (plan === "pro") return "Pro";
  return "Free";
}

export function BillingSettingsCard() {
  const [portalLoading, setPortalLoading] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["billing"],
    queryFn: fetchBilling,
  });

  async function openPortal() {
    setPortalLoading(true);
    try {
      const { data: portal, error } = await authClient.dodopayments.customer.portal();
      if (error) throw new Error(error.message ?? "Could not open billing portal");
      if (!portal?.url) throw new Error("Billing portal URL missing");
      window.location.href = portal.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open billing portal");
      setPortalLoading(false);
    }
  }

  const plan = data?.plan ?? "free";
  const isPaid = plan === "pro" || plan === "business";
  const isBusiness = plan === "business";

  return (
    <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
      <CardHeader className="px-6 pt-5 pb-4">
        <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
          <CreditCard size={16} style={{ color: AMBER }} />
          Billing
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {isBusiness
            ? "Manage your Business subscription via Dodo Payments"
            : isPaid
              ? "Manage your Pro subscription or upgrade to Business"
              : "Upgrade to Pro or Business via Dodo Payments"}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 space-y-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/3 px-4 py-3">
          <span className="text-sm text-muted-foreground">Current plan</span>
          {isLoading ? (
            <BoltPillSkeleton />
          ) : isError ? (
            <span className="text-sm text-muted-foreground">Unavailable</span>
          ) : (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                isPaid ? "text-black" : "border border-white/10 bg-white/5 text-foreground",
              )}
              style={isPaid ? { background: AMBER } : undefined}
            >
              {planLabel(plan)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {plan === "free" && (
            <UpgradePlanButton className="h-10 rounded-lg px-4" label="Upgrade to Pro" plan="pro" />
          )}
          {!isBusiness && data?.businessCheckout && (
            <UpgradePlanButton
              className="h-10 rounded-lg px-4"
              label="Upgrade to Business"
              plan="business"
              variant={plan === "free" ? "secondary" : "primary"}
            />
          )}
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
