"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { BUSINESS_CHECKOUT_SLUG, PRO_CHECKOUT_SLUG } from "@/lib/dodo-billing";
import { apiJson } from "@/lib/api-fetch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type UpgradePlanButtonProps = {
  className?: string;
  variant?: "primary" | "secondary";
  label?: string;
  plan?: "pro" | "business";
  redirectToSignUp?: boolean;
};

export function UpgradePlanButton({
  className,
  variant = "primary",
  label,
  plan = "pro",
  redirectToSignUp = true,
}: UpgradePlanButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const slug = plan === "business" ? BUSINESS_CHECKOUT_SLUG : PRO_CHECKOUT_SLUG;
  const buttonLabel = label ?? (plan === "business" ? "Get Business" : "Get Pro");

  async function handleClick() {
    setLoading(true);
    try {
      const session = await authClient.getSession();
      if (!session.data?.user) {
        router.push(
          redirectToSignUp ? `/sign-up?plan=${plan}` : "/sign-in?next=/dashboard"
        );
        return;
      }

      const billing = await apiJson<{ checkoutEnabled: boolean; businessCheckout: boolean }>(
        "/api/billing"
      );
      if (!billing.checkoutEnabled) {
        throw new Error(
          "Dodo Payments is not configured here. Add DODO_PAYMENTS_API_KEY to apps/web/.dev.vars and restart the dev server."
        );
      }
      if (plan === "business" && !billing.businessCheckout) {
        throw new Error(
          "Business checkout is not configured. Set DODO_BUSINESS_PRODUCT_ID in .dev.vars and restart."
        );
      }

      const { data, error } = await authClient.dodopayments.checkoutSession({
        slug,
        referenceId: `${plan}_${session.data.user.id}`,
      });

      if (error) {
        throw new Error(error.message ?? "Could not start checkout");
      }

      if (!data?.url) {
        throw new Error(
          plan === "business"
            ? "Checkout URL missing. Is DODO_BUSINESS_PRODUCT_ID configured?"
            : "Checkout URL missing. Is DODO_PRO_PRODUCT_ID configured?"
        );
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start checkout");
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        variant === "primary"
          ? "bg-amber-400 text-black hover:bg-amber-400/90"
          : "border border-white/10 bg-white/5 text-foreground hover:bg-white/10",
        className
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : buttonLabel}
    </Button>
  );
}

/** @deprecated Use UpgradePlanButton */
export function UpgradeProButton(props: Omit<UpgradePlanButtonProps, "plan">) {
  return <UpgradePlanButton {...props} plan="pro" />;
}
