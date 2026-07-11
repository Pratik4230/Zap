"use client"

import { FlipWords } from "@/components/ui/flip-words"

export function HeroHeadline() {
  return (
    <h1 className="relative z-10 mb-5 text-5xl font-bold tracking-tight md:text-6xl">
      <span
        className="block"
        style={{
          background: "linear-gradient(135deg, oklch(0.92 0.18 80) 0%, oklch(0.769 0.188 70.08) 40%, oklch(0.85 0.20 75) 70%, oklch(0.72 0.16 65) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 0 18px oklch(0.769 0.188 70.08 / 45%))",
        }}
      >
        Short links that are
      </span>
      <span className="inline-flex whitespace-nowrap">
        <FlipWords
          words={["worldwide", "instant", "trackable", "secure"]}
          className="text-[oklch(0.769_0.188_70.08)]"
        />
      </span>
    </h1>
  )
}
