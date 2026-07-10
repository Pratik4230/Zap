import Link from "next/link";
import { Zap, ArrowRight, ChevronRight, Check } from "lucide-react";
import { HeroDotBackground } from "@/components/landing/hero-dot-background";
import { HeroHeadline } from "@/components/landing/hero-headline";
import { DemoLink } from "@/components/landing/demo-link";
import {
  AMBER,
  AMBER_BORDER,
  AMBER_DIM,
  FAQ,
  FEATURES,
  FREE_TIER,
  HERO_STATS,
  HIGHLIGHTS,
  STEPS,
} from "@/lib/landing";
import { siteConfig } from "@/lib/site";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-50 border-b border-white/6 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}
            >
              <Zap size={16} style={{ color: AMBER }} strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">Xaply</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {["Features", "Pricing", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: AMBER, color: "oklch(0 0 0)" }}
            >
              Get started <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-black px-6 pt-20 pb-20 text-center">
        <HeroDotBackground />

        <div className="relative mx-auto max-w-3xl">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: AMBER_BORDER, color: AMBER, background: AMBER_DIM }}
          >
            <Zap size={11} strokeWidth={2.5} />
            Runs on Cloudflare Edge. Sub-10ms redirects worldwide.
          </div>

          <HeroHeadline />

          <p className="relative z-10 mx-auto mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Turn long URLs into {siteConfig.shortLinkDomain} links your audience actually clicks.
            Fast redirects, honest analytics, and tools that stay out of your way.
          </p>

          <div className="relative z-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: AMBER, color: "oklch(0 0 0)" }}
            >
              Start for free <ArrowRight size={15} />
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-white/4"
              style={{ borderColor: "oklch(1 0 0 / 12%)" }}
            >
              Sign in
            </Link>
          </div>

          <div className="relative z-10 mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3">
            {HERO_STATS.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-white/8 bg-neutral-950 px-3 py-3"
              >
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <div className="relative z-10 mx-auto mt-10 max-w-md rounded-2xl border border-white/8 bg-neutral-950 p-4 text-left">
            <div className="mb-2 flex items-center gap-2 px-1">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-xs text-muted-foreground/50">
                {siteConfig.appDomain} dashboard
              </span>
            </div>
            <div className="space-y-2.5 pt-1">
              <div className="rounded-lg border border-white/8 bg-black px-3 py-2.5 text-xs text-muted-foreground">
                https://my-very-long-domain.com/blog/how-to-share-links-that-load-instantly
              </div>
              <div className="flex items-center gap-2 px-1">
                <div className="h-px flex-1 bg-white/6" />
                <Zap size={11} style={{ color: AMBER }} />
                <div className="h-px flex-1 bg-white/6" />
              </div>
              <DemoLink />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/6 bg-neutral-950 px-6 py-20">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Why teams switch to Xaply
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three problems every link tool should solve. We focus on these and skip the rest.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, tag, title, hook, description, points }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black p-8 transition-colors hover:border-amber-500/30"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-amber-500/80 via-amber-400/30 to-transparent" />
              <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: AMBER }}>
                {tag}
              </p>
              <div
                className="mt-5 mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}
              >
                <Icon size={20} style={{ color: AMBER }} />
              </div>
              <h3 className="text-2xl font-bold text-foreground">{title}</h3>
              <p className="mt-3 text-base font-medium leading-snug text-foreground/90">{hook}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
              <ul className="mt-5 space-y-2 border-t border-white/6 pt-5">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check size={14} className="mt-0.5 shrink-0" style={{ color: AMBER }} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-black px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Built for people who share links daily
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
              Every feature exists because a real link problem needed solving. No filler, no upsells
              for things we have not shipped.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, hook, description, points }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/8 bg-neutral-950 p-7 transition-colors hover:border-amber-500/20"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}
                  >
                    <Icon size={22} style={{ color: AMBER }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm font-semibold" style={{ color: AMBER }}>
                      {hook}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {points.map((point) => (
                    <li
                      key={point}
                      className="rounded-full border border-white/8 bg-black px-3 py-1 text-xs text-muted-foreground"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">How it works</h2>
            <p className="mt-3 text-muted-foreground">Live in under a minute. No setup guide required.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map(({ number, title, description }, i) => (
              <div
                key={number}
                className="relative rounded-2xl border border-white/8 bg-black p-6 md:text-left"
              >
                {i < STEPS.length - 1 && (
                  <ChevronRight
                    size={20}
                    className="absolute top-8 -right-3 hidden text-muted-foreground/30 md:block"
                  />
                )}
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl font-mono text-sm font-bold"
                  style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}`, color: AMBER }}
                >
                  {number}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-black px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Simple, generous pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              Start free. Upgrade only when we ship paid plans.
            </p>
          </div>

          <div
            className="mx-auto max-w-md rounded-3xl border p-8"
            style={{
              background: "oklch(0.1 0 0)",
              borderColor: AMBER_BORDER,
              boxShadow: "0 0 60px oklch(0.769 0.188 70.08 / 8%)",
            }}
          >
            <div className="mb-6 text-center">
              <p className="text-sm font-medium" style={{ color: AMBER }}>
                Free forever
              </p>
              <p className="mt-2 text-5xl font-bold tracking-tight text-foreground">$0</p>
              <p className="mt-1 text-sm text-muted-foreground">No credit card. No trial limits.</p>
            </div>
            <ul className="space-y-3">
              {FREE_TIER.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                  <Check size={15} style={{ color: AMBER }} className="shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: AMBER, color: "oklch(0 0 0)" }}
            >
              Create free account <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-neutral-950 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-2xl border border-white/8 bg-black p-5"
              >
                <h3 className="font-semibold text-foreground">{q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="rounded-3xl border p-12"
            style={{
              background: "oklch(0.1 0 0)",
              borderColor: AMBER_BORDER,
              boxShadow: "0 0 60px oklch(0.769 0.188 70.08 / 8%)",
            }}
          >
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}
            >
              <Zap size={24} style={{ color: AMBER }} strokeWidth={2.5} />
            </div>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
              Ready to shorten your links?
            </h2>
            <p className="mb-8 text-muted-foreground">Free to start. No credit card required.</p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: AMBER, color: "oklch(0 0 0)" }}
            >
              Create your account <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/6 bg-black px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: AMBER }} strokeWidth={2.5} />
              <span className="text-sm font-semibold text-foreground">Xaply</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Built with <span aria-label="love">❤️</span> in Pune, India
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={siteConfig.owner.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              LinkedIn
            </a>
            <a
              href={siteConfig.owner.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {siteConfig.owner.twitterHandle}
            </a>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Xaply. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
