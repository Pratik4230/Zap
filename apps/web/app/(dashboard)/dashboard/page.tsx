"use client";

import { useState } from "react";
import { Copy, ExternalLink, MoreHorizontal, Plus, TrendingUp, Link2, MousePointerClick, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateLinkDialog } from "@/components/dashboard/create-link-dialog";

const AMBER = "oklch(0.769 0.188 70.08)";

const MOCK_STATS = [
  { label: "Total Links", value: "128", change: "+12 this month", icon: Link2 },
  { label: "Total Clicks", value: "48,291", change: "+2,841 this week", icon: MousePointerClick },
  { label: "Active Links", value: "114", change: "89% active rate", icon: Activity },
  { label: "Click Rate", value: "4.2%", change: "+0.8% vs last month", icon: TrendingUp },
];

const MOCK_LINKS = [
  { id: "1", slug: "gh-repo", domain: "go.zap.dev", destination: "https://github.com/pratik4230/zap", clicks: 1240, status: "active", createdAt: "Jun 10, 2026" },
  { id: "2", slug: "portfolio", domain: "go.zap.dev", destination: "https://pratik.dev", clicks: 830, status: "active", createdAt: "Jun 12, 2026" },
  { id: "3", slug: "discord", domain: "go.zap.dev", destination: "https://discord.gg/example", clicks: 421, status: "paused", createdAt: "Jun 15, 2026" },
  { id: "4", slug: "launch", domain: "go.zap.dev", destination: "https://producthunt.com/posts/zap", clicks: 3102, status: "active", createdAt: "Jun 18, 2026" },
  { id: "5", slug: "docs", domain: "go.zap.dev", destination: "https://docs.zap.dev", clicks: 567, status: "active", createdAt: "Jun 20, 2026" },
];

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { label: "Active", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    paused: { label: "Paused", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    expired: { label: "Expired", class: "bg-red-500/10 text-red-400 border-red-500/20" },
  }[status] ?? { label: status, class: "" };

  return (
    <Badge variant="outline" className={`text-xs font-medium ${config.class}`}>
      {config.label}
    </Badge>
  );
}

function LinkActions({ link }: { link: typeof MOCK_LINKS[0] }) {
  const shortUrl = `https://${link.domain}/${link.slug}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <MoreHorizontal size={15} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(shortUrl)}>
          <Copy size={13} className="mr-2" /> Copy short URL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(link.destination, "_blank")}>
          <ExternalLink size={13} className="mr-2" /> Open destination
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          {link.status === "active" ? "Pause link" : "Activate link"}
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const loading = false; // replace with real loading state

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Links</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track all your short links
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 font-semibold"
          style={{ background: AMBER, color: "oklch(0 0 0)" }}
        >
          <Plus size={16} />
          New link
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MOCK_STATS.map(({ label, value, change, icon: Icon }) => (
          <Card
            key={label}
            className="border-white/6"
            style={{ background: "oklch(0.12 0 0)" }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </CardTitle>
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${AMBER}15` }}
              >
                <Icon size={14} style={{ color: AMBER }} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{change}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Links table */}
      <Card
        className="border-white/6"
        style={{ background: "oklch(0.12 0 0)" }}
      >
        <CardHeader className="px-6 pt-5 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">All Links</CardTitle>
          <p className="text-xs text-muted-foreground">{MOCK_LINKS.length} links</p>
        </CardHeader>
        <div className="border-t border-white/6">
          <Table>
            <TableHeader>
              <TableRow className="border-white/6 hover:bg-transparent">
                <TableHead className="text-xs text-muted-foreground font-medium pl-6">Short URL</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Destination</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium text-right">Clicks</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-xs text-muted-foreground font-medium">Created</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/6">
                      <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                : MOCK_LINKS.map((link) => (
                    <TableRow
                      key={link.id}
                      className="border-white/6 hover:bg-white/2 group"
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground text-sm">
                            {link.domain}/{link.slug}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(`https://${link.domain}/${link.slug}`)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy size={12} className="text-muted-foreground hover:text-foreground" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="max-w-60 truncate block text-sm text-muted-foreground">
                          {link.destination}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium text-foreground">
                        {link.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={link.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {link.createdAt}
                      </TableCell>
                      <TableCell>
                        <LinkActions link={link} />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateLinkDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
