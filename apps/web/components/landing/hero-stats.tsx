"use client";

import { useEffect, useState } from "react";
import { HERO_STATS } from "@/lib/landing";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

function parseStatValue(value: string) {
  const match = value.match(/^([^0-9]*)([0-9]+)(.*)$/);
  if (!match) {
    return { prefix: "", target: 0, suffix: value };
  }

  return {
    prefix: match[1],
    target: Number(match[2]),
    suffix: match[3],
  };
}

function useCountUp(target: number, active: boolean, duration = 800) {
  const [count, setCount] = useState(active ? target : 0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(target * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return count;
}

function StatValue({ value, active }: { value: string; active: boolean }) {
  const { prefix, target, suffix } = parseStatValue(value);
  const count = useCountUp(target, active);

  return (
    <>
      {prefix}
      {count}
      {suffix}
    </>
  );
}

export function HeroStats() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.4 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const active = inView || prefersReducedMotion;

  return (
    <div ref={ref} className="relative z-10 mx-auto mt-10 grid max-w-lg grid-cols-3 gap-3">
      {HERO_STATS.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-xl border border-white/8 bg-neutral-950 px-3 py-3"
        >
          <p className="text-lg font-bold text-foreground">
            {prefersReducedMotion ? value : <StatValue value={value} active={active} />}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}
