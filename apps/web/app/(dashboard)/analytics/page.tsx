"use client";

import { BarChart3, Globe, Monitor, Smartphone, Tablet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AMBER = "oklch(0.769 0.188 70.08)";

const TOP_LINKS = [
  { slug: "launch", clicks: 3102, change: "+12%" },
  { slug: "gh-repo", clicks: 1240, change: "+8%" },
  { slug: "portfolio", clicks: 830, change: "+3%" },
  { slug: "docs", clicks: 567, change: "-2%" },
  { slug: "discord", clicks: 421, change: "+1%" },
];

const DEVICES = [
  { label: "Desktop", icon: Monitor, value: 58, color: AMBER },
  { label: "Mobile", icon: Smartphone, value: 35, color: "oklch(0.7 0.15 200)" },
  { label: "Tablet", icon: Tablet, value: 7, color: "oklch(0.65 0.15 280)" },
];

const COUNTRIES = [
  { country: "India", code: "IN", clicks: 18420 },
  { country: "United States", code: "US", clicks: 12300 },
  { country: "United Kingdom", code: "GB", clicks: 4100 },
  { country: "Germany", code: "DE", clicks: 2800 },
  { country: "Canada", code: "CA", clicks: 2100 },
];

const DAILY = [
  { day: "Mon", clicks: 1240 },
  { day: "Tue", clicks: 2100 },
  { day: "Wed", clicks: 1800 },
  { day: "Thu", clicks: 3200 },
  { day: "Fri", clicks: 2700 },
  { day: "Sat", clicks: 980 },
  { day: "Sun", clicks: 760 },
];

const MAX_DAILY = Math.max(...DAILY.map((d) => d.clicks));

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Insights across all your links
        </p>
      </div>

      {/* Clicks over time */}
      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={16} style={{ color: AMBER }} />
              Clicks — Last 7 Days
            </CardTitle>
            <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
              12,780 total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-end gap-3 h-40">
            {DAILY.map(({ day, clicks }) => {
              const height = Math.max(4, (clicks / MAX_DAILY) * 100);
              return (
                <div key={day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground">{clicks.toLocaleString()}</span>
                  <div className="w-full rounded-t-md transition-all duration-500 relative group" style={{
                    height: `${height}%`,
                    background: `${AMBER}30`,
                    border: `1px solid ${AMBER}40`,
                  }}>
                    <div className="absolute inset-0 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `${AMBER}50` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top links */}
        <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
          <CardHeader className="px-6 pt-5 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">Top Links</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-3">
            {TOP_LINKS.map(({ slug, clicks, change }, i) => {
              const maxClicks = TOP_LINKS[0].clicks;
              const pct = (clicks / maxClicks) * 100;
              const isPositive = change.startsWith("+");
              return (
                <div key={slug} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/60 w-4 font-mono">{i + 1}</span>
                      <span className="text-sm font-medium text-foreground">go.zap.dev/{slug}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>{change}</span>
                      <span className="text-sm font-mono text-muted-foreground">{clicks.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-white/6">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: AMBER }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Countries */}
        <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
          <CardHeader className="px-6 pt-5 pb-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Globe size={16} style={{ color: AMBER }} />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-3">
            {COUNTRIES.map(({ country, code, clicks }) => {
              const maxClicks = COUNTRIES[0].clicks;
              const pct = (clicks / maxClicks) * 100;
              return (
                <div key={code} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{country}</span>
                    <span className="text-sm font-mono text-muted-foreground">{clicks.toLocaleString()}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/6">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: AMBER }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Devices */}
      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
       <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="text-base font-semibold text-foreground">Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-center gap-8">
            {DEVICES.map(({ label, icon: Icon, value, color }) => (
              <div key={label} className="flex flex-col items-center gap-3">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(1 0 0 / 6%)" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="2.5"
                      strokeDasharray={`${value} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <Icon size={14} style={{ color }} />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-foreground">{value}%</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
