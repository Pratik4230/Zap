import { HERO_STATS } from "@/lib/landing";

export function HeroStats() {
  return (
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
  );
}
