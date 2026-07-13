"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { UpgradeProButton } from "@/components/billing/upgrade-pro-button";
import { AMBER, AMBER_BORDER, PRICING_PLANS } from "@/lib/landing";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export function PricingCard() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.15 });
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div ref={ref} className="grid gap-6 lg:grid-cols-3">
      {PRICING_PLANS.map((plan, planIndex) => {
        const showGlint = inView && !prefersReducedMotion && plan.highlighted && !plan.comingSoon;

        return (
          <div
            key={plan.id}
            className={cn(
              "landing-pricing-card relative flex flex-col rounded-3xl border p-8",
              plan.comingSoon && "opacity-70",
              plan.highlighted
                ? "border-amber-400/40 shadow-[0_0_60px_oklch(0.769_0.188_70.08/10%)] lg:scale-[1.02]"
                : "border-white/10",
              prefersReducedMotion && plan.highlighted && "shadow-[0_0_60px_oklch(0.769_0.188_70.08/8%)]",
            )}
            style={{
              background: plan.highlighted ? "oklch(0.11 0.01 75)" : "oklch(0.1 0 0)",
              borderColor: plan.highlighted ? AMBER_BORDER : undefined,
            }}
          >
            {plan.highlighted && !plan.comingSoon && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: AMBER, color: "oklch(0 0 0)" }}
              >
                {plan.badge}
              </span>
            )}

            <div className="mb-6 text-center">
              {(!plan.highlighted || plan.comingSoon) && (
                <p
                  className={cn(
                    "text-sm font-medium",
                    plan.comingSoon ? "text-amber-400/80" : "text-muted-foreground",
                  )}
                >
                  {plan.badge}
                </p>
              )}
              <h3 className={cn("font-semibold text-foreground", plan.highlighted ? "mt-2 text-lg" : "mt-1")}>
                {plan.name}
              </h3>
              <p className="relative mt-3 text-5xl font-bold tracking-tight text-foreground">
                ${plan.price}
                {showGlint && (
                  <span
                    className="landing-price-glint-overlay pointer-events-none absolute inset-0"
                    aria-hidden
                  />
                )}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {plan.price === 0 ? "No credit card required" : `per ${plan.period}`}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
            </div>

            <ul className="flex-1 space-y-3">
              {plan.features.map((item, index) => (
                <li
                  key={item}
                  className={cn(
                    "landing-pricing-item flex items-start gap-2.5 text-sm text-foreground opacity-0",
                    (inView || prefersReducedMotion) && "is-visible",
                  )}
                  style={{ animationDelay: `${planIndex * 80 + index * 50}ms` }}
                >
                  <Check size={15} style={{ color: AMBER }} className="mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {plan.comingSoon ? (
              <div
                className="mt-8 flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-muted-foreground"
                aria-disabled
              >
                {plan.cta}
              </div>
            ) : plan.id === "pro" ? (
              <UpgradeProButton
                className="mt-8 h-11 w-full rounded-xl text-sm font-semibold"
                label={plan.cta}
              />
            ) : (
              <Link
                href={plan.href}
                className={cn(
                  "group mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90",
                  "border border-white/10 bg-white/5 text-foreground hover:bg-white/10",
                )}
              >
                {plan.cta}
                <ArrowRight size={15} className="landing-cta-arrow" />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
