"use client";

import { BarChart3, Globe, MapPin, Monitor, Smartphone, Tablet, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const AMBER = "oklch(0.769 0.188 70.08)";

const DEVICE_ICONS: Record<string, LucideIcon> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const DEVICE_COLORS: Record<string, string> = {
  desktop: AMBER,
  mobile: "oklch(0.7 0.15 200)",
  tablet: "oklch(0.65 0.15 280)",
  unknown: "oklch(0.5 0 0)",
};

interface AnalyticsData {
  daily: { date: string; label: string; clicks: number }[];
  totalClicks: number;
  topLinks: { slug: string; domain: string; title: string | null; clicks: number }[];
  countries: { country: string; count: number }[];
  cities: { label: string; count: number }[];
  devices: { device: string; count: number; pct: number }[];
}

async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch("/api/analytics");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json() as Promise<AnalyticsData>;
}

const SKELETON_HEIGHTS = [45, 70, 55, 90, 75, 40, 60];

function BarSkeleton() {
  return (
    <div className="flex items-end gap-3 h-40">
      {SKELETON_HEIGHTS.map((h, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <Skeleton className="w-full" style={{ height: `${h}%` }} />
          <Skeleton className="h-3 w-6" />
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  });

  const maxDaily = data ? Math.max(...data.daily.map((d) => d.clicks), 1) : 1;
  const maxCountry = data?.countries[0]?.count ?? 1;
  const maxCity = data?.cities[0]?.count ?? 1;
  const maxLink = data?.topLinks[0]?.clicks ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Insights across all your links
        </p>
      </div>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={16} style={{ color: AMBER }} />
              Clicks, Last 7 Days
            </CardTitle>
            {isLoading ? (
              <Skeleton className="h-5 w-24" />
            ) : (
              <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
                {(data?.totalClicks ?? 0).toLocaleString()} clicks
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {isLoading ? (
            <BarSkeleton />
          ) : (
            <div className="flex items-end gap-3 h-40">
              {data?.daily.map(({ label, clicks: count }) => {
                const height = Math.max(4, (count / maxDaily) * 100);
                return (
                  <div key={label} className="flex flex-1 flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground">{count > 0 ? count.toLocaleString() : ""}</span>
                    <div
                      className="w-full rounded-t-md transition-all duration-500 relative group"
                      style={{ height: `${height}%`, background: `${AMBER}30`, border: `1px solid ${AMBER}40` }}
                    >
                      <div
                        className="absolute inset-0 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: `${AMBER}50` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
          <CardHeader className="px-6 pt-5 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">Top Links</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-1 w-full" />
                </div>
              ))
            ) : data?.topLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No link data yet</p>
            ) : (
              data?.topLinks.map(({ slug, domain, clicks: count }, i) => (
                <div key={slug} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/60 w-4 font-mono">{i + 1}</span>
                      <span className="text-sm font-medium text-foreground">{domain}/{slug}</span>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">{count.toLocaleString()}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxLink) * 100}%`, background: AMBER }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
          <CardHeader className="px-6 pt-5 pb-4">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Globe size={16} style={{ color: AMBER }} />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-1 w-full" />
                </div>
              ))
            ) : data?.countries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No click data yet</p>
            ) : (
              data?.countries.map(({ country, count }) => (
                <div key={country} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{country}</span>
                    <span className="text-sm font-mono text-muted-foreground">{count.toLocaleString()}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(count / maxCountry) * 100}%`, background: AMBER }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <MapPin size={16} style={{ color: AMBER }} />
            Top Cities
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-5 space-y-3">
          {isLoading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-1 w-full" />
              </div>
            ))
          ) : data?.cities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No city data yet</p>
          ) : (
            data?.cities.map(({ label, count }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{label}</span>
                  <span className="text-sm font-mono text-muted-foreground shrink-0">
                    {count.toLocaleString()}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(count / maxCity) * 100}%`, background: AMBER }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="text-base font-semibold text-foreground">Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : data?.devices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No device data yet</p>
          ) : (
            <div className="flex items-center gap-8 flex-wrap">
              {data?.devices.map(({ device, pct }) => {
                const Icon = DEVICE_ICONS[device] ?? Monitor;
                const color = DEVICE_COLORS[device] ?? AMBER;
                return (
                  <div key={device} className="flex flex-col items-center gap-3">
                    <div className="relative flex h-20 w-20 items-center justify-center">
                      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="oklch(1 0 0 / 6%)" strokeWidth="2.5" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="2.5"
                          strokeDasharray={`${pct} 100`} strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <Icon size={14} style={{ color }} />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-foreground">{pct}%</p>
                      <p className="text-xs text-muted-foreground capitalize">{device}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
