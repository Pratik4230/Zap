"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { PRO_CHECKOUT_SLUG } from "@/lib/dodo-billing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type UpgradeProButtonProps = {
  className?: string;
  variant?: "primary" | "secondary";
  label?: string;
  redirectToSignUp?: boolean;
};

export function UpgradeProButton({
  className,
  variant = "primary",
  label = "Get Pro",
  redirectToSignUp = true,
}: UpgradeProButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const session = await authClient.getSession();
      if (!session.data?.user) {
        router.push(redirectToSignUp ? "/sign-up?plan=pro" : "/sign-in?next=/dashboard");
        return;
      }

      const { data, error } = await authClient.dodopayments.checkoutSession({
        slug: PRO_CHECKOUT_SLUG,
        referenceId: `pro_${session.data.user.id}`,
      });

      if (error) {
        throw new Error(error.message ?? "Could not start checkout");
      }

      if (!data?.url) {
        throw new Error("Checkout URL missing. Is DODO_PRO_PRODUCT_ID configured?");
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
      {loading ? <Loader2 className="size-4 animate-spin" /> : label}
    </Button>
  );
}
