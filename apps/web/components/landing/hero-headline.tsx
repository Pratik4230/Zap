"use client"

import { FlipWords } from "@/components/ui/flip-words"

export function HeroHeadline() {
  return (
    <h1 className="relative z-10 mb-5 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
      Short links that are{" "}
      <FlipWords
        words={["worldwide", "instant", "trackable", "secure"]}
        className="text-[oklch(0.769_0.188_70.08)]"
      />
    </h1>
  )
}
