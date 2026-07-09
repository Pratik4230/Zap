"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, BarChart3, ExternalLink, Globe, Link2, Monitor, Smartphone, Tablet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

const AMBER = "oklch(0.769 0.188 70.08)";

const DEVICE_ICONS: Record<string, React.ElementType> = {
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

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paused: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
};

interface LinkAnalyticsData {
  link: {
    id: string;
    slug: string;
    domain: string;
    destinationUrl: string;
    title: string | null;
    status: string;
    clickCount: number;
    clickLimit: number | null;
    expiresAt: string | null;
    createdAt: string;
  };
  daily: { date: string; label: string; clicks: number }[];
  totalClicks: number;
  countries: { label: string; count: number }[];
  devices: { device: string; count: number; pct: number }[];
  browsers: { label: string; count: number }[];
  os: { label: string; count: number }[];
  referrers: { label: string; count: number }[];
}

async function fetchLinkAnalytics(id: string): Promise<LinkAnalyticsData> {
  const res = await fetch(`/api/links/${id}/analytics`);
  if (res.status === 404) throw new Error("Link not found");
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json() as Promise<LinkAnalyticsData>;
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

function CountList({
  items,
  emptyMessage,
  max,
}: {
  items: { label: string; count: number }[];
  emptyMessage: string;
  max: number;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map(({ label, count }) => (
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
              style={{ width: `${max > 0 ? (count / max) * 100 : 0}%`, background: AMBER }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LinkAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["link-analytics", id],
    queryFn: () => fetchLinkAnalytics(id),
  });

  const maxDaily = data ? Math.max(...data.daily.map((d) => d.clicks), 1) : 1;
  const maxCountry = data?.countries[0]?.count ?? 1;
  const maxBrowser = data?.browsers[0]?.count ?? 1;
  const maxOs = data?.os[0]?.count ?? 1;
  const maxReferrer = data?.referrers[0]?.count ?? 1;

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2">
          <Link href="/dashboard">
            <ArrowLeft size={14} />
            Back to links
          </Link>
        </Button>
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load analytics"}
        </p>
      </div>
    );
  }

  const link = data?.link;
  const shortUrl = link ? `https://${link.domain}/${link.slug}` : "";

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/dashboard">
            <ArrowLeft size={14} />
            Back to links
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : link ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Link2 size={20} style={{ color: AMBER }} />
                {link.domain}/{link.slug}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs capitalize ${STATUS_STYLES[link.status] ?? ""}`}
              >
                {link.status}
              </Badge>
            </div>
            {link.title && (
              <p className="text-sm text-muted-foreground">{link.title}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono text-foreground">{shortUrl}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5"
                onClick={() => window.open(link.destinationUrl, "_blank")}
              >
                <ExternalLink size={12} />
                Destination
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                <span className="text-muted-foreground">All-time clicks: </span>
                <span className="font-semibold text-foreground">
                  {link.clickCount.toLocaleString()}
                  {link.clickLimit != null ? ` / ${link.clickLimit.toLocaleString()}` : ""}
                </span>
              </span>
              {link.expiresAt && (
                <span>
                  <span className="text-muted-foreground">Expires: </span>
                  <span className="text-foreground">
                    {new Date(link.expiresAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={16} style={{ color: AMBER }} />
              Clicks — Last 7 Days
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
                    <span className="text-xs text-muted-foreground">
                      {count > 0 ? count.toLocaleString() : ""}
                    </span>
                    <div
                      className="w-full rounded-t-md transition-all duration-500 relative group"
                      style={{
                        height: `${height}%`,
                        background: `${AMBER}30`,
                        border: `1px solid ${AMBER}40`,
                      }}
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
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Globe size={16} style={{ color: AMBER }} />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <CountList
                items={data?.countries ?? []}
                emptyMessage="No country data yet"
                max={maxCountry}
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
          <CardHeader className="px-6 pt-5 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">Top Referrers</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <CountList
                items={data?.referrers ?? []}
                emptyMessage="No referrer data yet"
                max={maxReferrer}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
          <CardHeader className="px-6 pt-5 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">Browsers</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <CountList
                items={data?.browsers ?? []}
                emptyMessage="No browser data yet"
                max={maxBrowser}
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
          <CardHeader className="px-6 pt-5 pb-4">
            <CardTitle className="text-base font-semibold text-foreground">Operating Systems</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5">
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <CountList items={data?.os ?? []} emptyMessage="No OS data yet" max={maxOs} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4">
          <CardTitle className="text-base font-semibold text-foreground">Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-full" />
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
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke="oklch(1 0 0 / 6%)"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9"
                          fill="none"
                          stroke={color}
                          strokeWidth="2.5"
                          strokeDasharray={`${pct} 100`}
                          strokeLinecap="round"
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
