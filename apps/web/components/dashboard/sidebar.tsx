"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LinkIcon, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LinkIcon, label: "Links" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const AMBER = "oklch(0.769 0.188 70.08)";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-white/6"
      style={{ background: "oklch(0.1 0 0 / 80%)" }}>

      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/6 px-5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `${AMBER}20`, border: `1px solid ${AMBER}40` }}
        >
          <Zap size={16} style={{ color: AMBER }} strokeWidth={2.5} />
        </div>
        <span className="text-base font-bold tracking-tight text-foreground">Zap</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/4"
              )}
              style={active ? {
                background: `${AMBER}15`,
                color: AMBER,
              } : {}}
            >
              <Icon
                size={16}
                className="shrink-0"
                style={active ? { color: AMBER } : {}}
              />
              {label}
              {active && (
                <div
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: AMBER }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/6 p-3">
        <p className="px-3 text-xs text-muted-foreground/50">
          Zap © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
