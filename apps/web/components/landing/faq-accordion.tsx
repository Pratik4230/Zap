import { ChevronDown } from "lucide-react";
import { FAQ } from "@/lib/landing";

export function FaqAccordion() {
  return (
    <div className="space-y-4">
      {FAQ.map(({ q, a }) => (
        <details
          key={q}
          className="group rounded-2xl border border-white/8 bg-black open:border-amber-500/20"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-left [&::-webkit-details-marker]:hidden">
            <h3 className="font-semibold text-foreground">{q}</h3>
            <ChevronDown
              size={18}
              className="shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
            {a}
          </p>
        </details>
      ))}
    </div>
  );
}
