"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { MovingBorder } from "@/components/ui/moving-border";
import { AMBER, AMBER_BORDER, AMBER_DIM } from "@/lib/landing";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section className="bg-black px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <div
          className="relative overflow-hidden rounded-3xl p-px"
          style={{ borderRadius: "1.5rem" }}
        >
          <div
            className="absolute inset-0"
            style={{ borderRadius: "calc(1.5rem * 0.96)" }}
          >
            <MovingBorder duration={4000} rx="8%" ry="8%">
              <div className="size-20 bg-[radial-gradient(oklch(0.769_0.188_70.08)_40%,transparent_60%)] opacity-90" />
            </MovingBorder>
          </div>

          <div
            className="relative rounded-3xl border p-12"
            style={{
              background: "oklch(0.1 0 0)",
              borderColor: AMBER_BORDER,
              boxShadow: "0 0 60px oklch(0.769 0.188 70.08 / 8%)",
            }}
          >
            <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
              <span
                className="landing-cta-pulse-ring pointer-events-none absolute inset-0 rounded-2xl"
                style={{ border: `1px solid ${AMBER_BORDER}` }}
                aria-hidden
              />
              <div
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-2xl",
                )}
                style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}
              >
                <AppIcon size={40} />
              </div>
            </div>

            <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
              Ready to shorten your links?
            </h2>
            <p className="mb-8 text-muted-foreground">Free to start. No credit card required.</p>
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: AMBER, color: "oklch(0 0 0)" }}
            >
              Create your account
              <ArrowRight size={15} className="landing-cta-arrow" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
