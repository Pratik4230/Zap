"use client";

import { useState, useCallback } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AMBER = "oklch(0.769 0.188 70.08)";

type LinkStatus = "active" | "paused" | "expired";

interface Link {
  id: string;
  slug: string;
  domain: string;
  destinationUrl: string;
  title: string | null;
  clickCount: number;
  status: LinkStatus;
  createdAt: string;
}

async function fetchLinks(): Promise<Link[]> {
  const res = await fetch("/api/links");
  if (!res.ok) throw new Error("Failed to fetch links");
  const data = await res.json() as { links: Link[] };
  return data.links;
}

async function deleteLink(id: string) {
  const res = await fetch(`/api/links/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete link");
}

async function toggleLink(id: string, status: LinkStatus) {
  const res = await fetch(`/api/links/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: status === "active" ? "paused" : "active" }),
  });
  if (!res.ok) throw new Error("Failed to update link");
}

function StatusBadge({ status }: { status: LinkStatus }) {
  const config: Record<LinkStatus, { label: string; class: string }> = {
    active: { label: "Active", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    paused: { label: "Paused", class: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    expired: { label: "Expired", class: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const { label, class: cls } = config[status] ?? { label: status, class: "" };
  return <Badge variant="outline" className={`text-xs font-medium ${cls}`}>{label}</Badge>;
}

function LinkActions({ link, onDelete, onToggle }: {
  link: Link;
  onDelete: (id: string) => void;
  onToggle: (id: string, status: LinkStatus) => void;
}) {
  const shortUrl = `https://${link.domain}/${link.slug}`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <MoreHorizontal size={15} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(shortUrl); toast.success("Copied!"); }}>
          <Copy size={13} className="mr-2" /> Copy short URL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(link.destinationUrl, "_blank")}>
          <ExternalLink size={13} className="mr-2" /> Open destination
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggle(link.id, link.status)}>
          {link.status === "active" ? "Pause link" : "Activate link"}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(link.id)}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: userLinks, isLoading } = useQuery({
    queryKey: ["links"],
    queryFn: fetchLinks,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Link deleted");
    },
    onError: () => toast.error("Failed to delete link"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LinkStatus }) => toggleLink(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["links"] }),
    onError: () => toast.error("Failed to update link"),
  });

  const totalClicks = userLinks?.reduce((sum, l) => sum + l.clickCount, 0) ?? 0;
  const activeLinks = userLinks?.filter((l) => l.status === "active").length ?? 0;
  const totalLinks = userLinks?.length ?? 0;

  const stats = [
    { label: "Total Links", value: totalLinks.toString(), icon: Link2 },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick },
    { label: "Active Links", value: activeLinks.toString(), icon: Activity },
    { label: "Active Rate", value: totalLinks > 0 ? `${Math.round((activeLinks / totalLinks) * 100)}%` : "—", icon: TrendingUp },
  ];

  const handleCreated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["links"] });
  }, [queryClient]);

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${AMBER}15` }}>
                <Icon size={14} style={{ color: AMBER }} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">All Links</CardTitle>
          {!isLoading && (
            <p className="text-xs text-muted-foreground">{userLinks?.length ?? 0} links</p>
          )}
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
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="border-white/6">
                    <TableCell className="pl-6"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : userLinks?.length === 0 ? (
                <TableRow className="border-white/6">
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                    No links yet.{" "}
                    <button
                      onClick={() => setCreateOpen(true)}
                      className="font-medium transition-colors"
                      style={{ color: AMBER }}
                    >
                      Create your first link
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
                userLinks?.map((link) => (
                  <TableRow key={link.id} className="border-white/6 hover:bg-white/2 group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">
                          {link.domain}/{link.slug}
                        </span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(`https://${link.domain}/${link.slug}`); toast.success("Copied!"); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy size={12} className="text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      {link.title && <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-45">{link.title}</p>}
                    </TableCell>
                    <TableCell>
                      <span className="max-w-60 truncate block text-sm text-muted-foreground">
                        {link.destinationUrl}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-foreground">
                      {link.clickCount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={link.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(link.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <LinkActions
                        link={link}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        onToggle={(id, status) => toggleMutation.mutate({ id, status })}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <CreateLinkDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
    </div>
  );
}
