"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { AMBER, AMBER_BORDER, FREE_TIER } from "@/lib/landing";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

export function PricingCard() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const showGlint = inView && !prefersReducedMotion;

  return (
    <div
      ref={ref}
      className={cn(
        "landing-pricing-card mx-auto max-w-md rounded-3xl border p-8",
        prefersReducedMotion && "shadow-[0_0_60px_oklch(0.769_0.188_70.08/8%)]",
      )}
      style={{
        background: "oklch(0.1 0 0)",
        borderColor: AMBER_BORDER,
      }}
    >
      <div className="mb-6 text-center">
        <p className="text-sm font-medium" style={{ color: AMBER }}>
          Free forever
        </p>
        <p className="relative mt-2 text-5xl font-bold tracking-tight text-foreground">
          $0
          {showGlint && (
            <span className="landing-price-glint-overlay pointer-events-none absolute inset-0" aria-hidden />
          )}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">No credit card. No trial limits.</p>
      </div>

      <ul className="space-y-3">
        {FREE_TIER.map((item, index) => (
          <li
            key={item}
            className={cn(
              "landing-pricing-item flex items-center gap-2.5 text-sm text-foreground opacity-0",
              (inView || prefersReducedMotion) && "is-visible",
            )}
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <Check size={15} style={{ color: AMBER }} className="shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      <Link
        href="/sign-up"
        className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90"
        style={{ background: AMBER, color: "oklch(0 0 0)" }}
      >
        Create free account
        <ArrowRight size={15} className="landing-cta-arrow" />
      </Link>
    </div>
  );
}
