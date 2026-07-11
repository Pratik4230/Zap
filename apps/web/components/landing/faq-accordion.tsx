"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ } from "@/lib/landing";

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {FAQ.map(({ q, a }, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={q}
            className={cn(
              "rounded-2xl border border-white/8 bg-black transition-colors",
              isOpen && "border-amber-500/20",
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
              aria-expanded={isOpen}
            >
              <h3 className="font-semibold text-foreground">{q}</h3>
              <ChevronDown
                size={18}
                className={cn(
                  "shrink-0 text-muted-foreground transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
