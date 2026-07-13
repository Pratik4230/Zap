"use client";

import { AppIcon } from "@/components/app-icon";
import { AMBER, AMBER_BORDER, AMBER_DIM } from "@/lib/landing";

const STEPS = [
  {
    number: "01",
    title: "Paste your URL",
    description:
      "Drop any long URL into the dashboard. Validated and shortened in milliseconds.",
    mocklet: (
      <div className="mt-auto pt-5">
        <div className="rounded-xl border border-white/8 bg-neutral-900 p-3">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Destination URL
          </p>
          <div className="rounded-lg border border-white/8 bg-black px-3 py-2 font-mono text-[11px] text-muted-foreground truncate">
            https://my-long-domain.com/blog/post-title
          </div>
          <div
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold"
            style={{ background: AMBER, color: "oklch(0 0 0)" }}
          >
            <AppIcon size={14} /> Create short link
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "02",
    title: "Share your short link",
    description:
      "Copy go.xaply.in/your-slug and drop it anywhere. Generate a QR code in one click.",
    mocklet: (
      <div className="mt-auto pt-5">
        <div className="rounded-xl border border-white/8 bg-neutral-900 p-3 space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Your short link
          </p>
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
            style={{ borderColor: AMBER_BORDER, background: AMBER_DIM }}
          >
            <span className="flex-1 font-mono text-xs font-semibold" style={{ color: AMBER }}>
              go.xaply.in/launch
            </span>
            <div
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ background: AMBER, color: "oklch(0 0 0)" }}
            >
              Copy
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-lg border border-white/8 bg-black py-1.5 text-center text-[11px] text-muted-foreground">
              Share
            </div>
            <div className="flex-1 rounded-lg border border-white/8 bg-black py-1.5 text-center text-[11px] text-muted-foreground">
              QR code
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "03",
    title: "Watch the clicks roll in",
    description:
      "Open analytics to see countries, cities, devices, and referrers in real time.",
    mocklet: (
      <div className="mt-auto pt-5">
        <div className="rounded-xl border border-white/8 bg-neutral-900 p-3 space-y-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Live analytics
          </p>
          {[
            { label: "India", pct: 85 },
            { label: "United States", pct: 60 },
            { label: "Germany", pct: 35 },
          ].map(({ label, pct }) => (
            <div key={label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono" style={{ color: AMBER }}>
                  {pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${AMBER}, oklch(0.65 0.15 65))`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
] as const;

export function HowItWorksSteps() {
  return (
    <>
      <style>{`
        @keyframes beam-travel {
          0%   { left: -6%; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { left: 106%; opacity: 0; }
        }
        .step-beam {
          animation: beam-travel 3.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* grid wrapper: pt-6 reserves space for the badge that overhangs the top of each card */}
      <div className="relative grid grid-cols-1 gap-6 pt-6 md:grid-cols-3">

        {/* connector line + traveling beam (desktop only) */}
        {/* spans from center of col-1 to center of col-3 */}
        <div
          className="pointer-events-none absolute hidden md:block"
          style={{
            top: "24px",                          /* half the badge height (h-12 = 48px / 2) */
            left: "calc(100% / 6)",               /* center of 1st column in a 3-col grid    */
            right: "calc(100% / 6)",              /* center of 3rd column from right          */
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${AMBER_BORDER} 10%, ${AMBER_BORDER} 90%, transparent)`,
          }}
        >
          {/* the light beam orb */}
          <div
            className="step-beam absolute top-1/2 h-6 w-12 -translate-y-1/2 rounded-full"
            style={{
              background: `radial-gradient(ellipse at center, ${AMBER} 0%, oklch(0.769 0.188 70.08 / 0%) 70%)`,
              filter: "blur(3px)",
            }}
          />
        </div>

        {STEPS.map(({ number, title, description, mocklet }) => (
          <div key={number} className="flex flex-col">
            {/* card */}
            <div
              className="group relative flex flex-1 flex-col rounded-2xl border px-6 pb-6 pt-10 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: "oklch(0.08 0 0)",
                borderColor: "oklch(1 0 0 / 8%)",
                minHeight: "340px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = AMBER_BORDER;
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 36px ${AMBER}20`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "oklch(1 0 0 / 8%)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              {/* top amber accent shimmer */}
              <div
                className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
                style={{
                  background: `linear-gradient(90deg, transparent, ${AMBER}60, transparent)`,
                }}
              />

              {/* number badge: centered at the very top of the card, half outside */}
              <div
                className="absolute left-1/2 top-0 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-mono text-base font-bold"
                style={{
                  background: "oklch(0.09 0 0)",
                  borderColor: AMBER,
                  color: AMBER,
                  boxShadow: `0 0 20px ${AMBER}50, 0 0 40px ${AMBER}20`,
                }}
              >
                {number}
              </div>

              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              {mocklet}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
