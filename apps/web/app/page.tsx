"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Zap,
  ArrowRight,
  Link2,
  BarChart3,
  Shield,
  Globe,
  MousePointerClick,
  Shuffle,
  ChevronRight,
  Copy,
  Check,
} from "lucide-react";

const AMBER = "oklch(0.769 0.188 70.08)";
const AMBER_DIM = "oklch(0.769 0.188 70.08 / 15%)";
const AMBER_BORDER = "oklch(0.769 0.188 70.08 / 30%)";

const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Edge-fast redirects",
    description: "Links resolve in under 10ms worldwide via Cloudflare's global network — no cold starts.",
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    description: "Track clicks, countries, devices, and browsers as they happen.",
  },
  {
    icon: Shuffle,
    title: "Custom slugs",
    description: "Choose your own slug or let us generate a compact one. Your brand, your URLs.",
  },
  {
    icon: Shield,
    title: "Link controls",
    description: "Pause, activate, or delete links at any time. Set expiry dates and click limits.",
  },
  {
    icon: Globe,
    title: "Device targeting",
    description: "Send iOS users to the App Store and Android users to Google Play automatically.",
  },
  {
    icon: Link2,
    title: "Branded domain",
    description: "All links live on go.zap.dev — bring your own domain on Pro.",
  },
];

const STEPS = [
  { number: "01", title: "Paste your URL", description: "Drop any long URL into the input — we handle the rest." },
  { number: "02", title: "Get your short link", description: "Receive a compact link instantly. Copy it with one click." },
  { number: "03", title: "Track every click", description: "Open the analytics dashboard to see who clicked, when, and from where." },
];

function DemoLink() {
  const [copied, setCopied] = useState(false);
  const url = "go.zap.dev/launch";

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm"
      style={{ background: "oklch(0.12 0 0)", borderColor: AMBER_BORDER }}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: AMBER_DIM }}>
        <Link2 size={13} style={{ color: AMBER }} />
      </div>
      <span className="flex-1 font-medium text-foreground">{url}</span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(`https://${url}`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
        style={{ background: copied ? AMBER_DIM : "transparent" }}
      >
        {copied ? <Check size={13} style={{ color: AMBER }} /> : <Copy size={13} className="text-muted-foreground" />}
      </button>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.08 0 0)" }}>

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-white/6 backdrop-blur-md" style={{ background: "oklch(0.08 0 0 / 80%)" }}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}
            >
              <Zap size={16} style={{ color: AMBER }} strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">Zap</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {["Features", "Pricing", "Docs"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
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

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-24 pt-20 text-center">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.769 0.188 70.08 / 12%) 0%, transparent 70%)`,
          }}
        />

        <div className="mx-auto max-w-3xl">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: AMBER_BORDER, color: AMBER, background: AMBER_DIM }}
          >
            <Zap size={11} strokeWidth={2.5} />
            Built on Cloudflare Edge — sub-10ms redirects
          </div>

          <h1 className="mb-5 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Short links that{" "}
            <span style={{ color: AMBER }}>move fast</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Zap turns your long URLs into compact, trackable links — powered by Cloudflare&apos;s global network for instant redirects anywhere on earth.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
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

          {/* Demo card */}
          <div
            className="mx-auto mt-14 max-w-md rounded-2xl border p-4 text-left"
            style={{ background: "oklch(0.1 0 0)", borderColor: "oklch(1 0 0 / 8%)" }}
          >
            <div className="mb-2 flex items-center gap-2 px-1">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
              <span className="ml-2 text-xs text-muted-foreground/50">zap.dev — dashboard</span>
            </div>
            <div className="space-y-2.5 pt-1">
              <div
                className="rounded-lg border px-3 py-2.5 text-xs text-muted-foreground"
                style={{ borderColor: "oklch(1 0 0 / 8%)", background: "oklch(0.13 0 0)" }}
              >
                https://my-very-long-domain.com/blog/2024/how-to-build-a-url-shortener-with-cloudflare
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

      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-3 text-muted-foreground">
              A focused set of tools for teams who care about performance and clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border p-6 transition-all duration-200 hover:border-amber-500/30"
                style={{ background: "oklch(0.1 0 0)", borderColor: "oklch(1 0 0 / 8%)" }}
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-all group-hover:scale-110"
                  style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}
                >
                  <Icon size={18} style={{ color: AMBER }} />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">How it works</h2>
            <p className="mt-3 text-muted-foreground">From long URL to tracked short link in seconds.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map(({ number, title, description }, i) => (
              <div key={number} className="relative flex flex-col items-center text-center md:items-start md:text-left">
                {i < STEPS.length - 1 && (
                  <ChevronRight
                    size={20}
                    className="absolute -right-3 top-4 hidden text-muted-foreground/30 md:block"
                  />
                )}
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl font-mono text-sm font-bold"
                  style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}`, color: AMBER }}
                >
                  {number}
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="rounded-3xl border p-12"
            style={{
              background: "oklch(0.1 0 0)",
              borderColor: AMBER_BORDER,
              boxShadow: `0 0 60px oklch(0.769 0.188 70.08 / 8%)`,
            }}
          >
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}
            >
              <Zap size={24} style={{ color: AMBER }} strokeWidth={2.5} />
            </div>
            <h2 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
              Ready to zap your links?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Free to start. No credit card required.
            </p>
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

      {/* Footer */}
      <footer className="border-t border-white/6 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} style={{ color: AMBER }} strokeWidth={2.5} />
            <span className="text-sm font-semibold text-foreground">Zap</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Zap. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
