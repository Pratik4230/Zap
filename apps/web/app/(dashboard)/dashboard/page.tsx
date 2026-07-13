"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Lock, MoreHorizontal, Pencil, Plus, QrCode, TrendingUp, Link2, MousePointerClick, Activity, BarChart3, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { EditLinkDialog, type EditableLink } from "@/components/dashboard/edit-link-dialog";
import { LinkQrDialog } from "@/components/dashboard/link-qr-dialog";
import { InfiniteScrollSentinel } from "@/components/dashboard/infinite-scroll-sentinel";
import { buildShortUrl } from "@/lib/short-url";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  LINK_SEARCH_DEBOUNCE_MS,
  LINK_SEARCH_MAX_LENGTH,
  LINKS_PAGE_SIZE,
  type LinkSortOption,
  type LinkStatusFilter,
} from "@/lib/filter-links";
import {
  addLinkToCache,
  applySummaryCreate,
  applySummaryDelete,
  applySummaryToggle,
  cancelLinksQueries,
  findLinkInCache,
  removeLinkFromCache,
  restoreLinksQueries,
  snapshotLinksQueries,
  updateLinkInCache,
  type DashboardLink,
  type LinksPageResponse,
  type LinksSummary,
  type LinkStatus,
} from "@/lib/links-query-cache";
import { cn } from "@/lib/utils";

const AMBER = "oklch(0.769 0.188 70.08)";

async function fetchLinksPage({
  page,
  q,
  status,
  sort,
}: {
  page: number;
  q: string;
  status: LinkStatusFilter;
  sort: LinkSortOption;
}): Promise<LinksPageResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(LINKS_PAGE_SIZE),
    status,
    sort,
  });
  if (q) params.set("q", q);

  const res = await fetch(`/api/links?${params}`);
  if (!res.ok) throw new Error("Failed to fetch links");
  return res.json() as Promise<LinksPageResponse>;
}

async function fetchLinksSummary(): Promise<LinksSummary> {
  const res = await fetch("/api/links/summary");
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json() as Promise<LinksSummary>;
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
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Failed to update link");
  }
}

async function updateLink({
  id,
  destinationUrl,
  title,
  expiresAt,
  clickLimit,
  password,
}: {
  id: string;
  destinationUrl: string;
  title: string | null;
  expiresAt: string | null;
  clickLimit: number | null;
  password?: string | null;
}) {
  const body: Record<string, unknown> = {
    destinationUrl,
    title,
    expiresAt,
    clickLimit,
  };
  if (password !== undefined) body.password = password;

  const res = await fetch(`/api/links/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json() as { error?: string };
    throw new Error(data.error ?? "Failed to update link");
  }

  const data = await res.json() as { link: DashboardLink };
  return data.link;
}

function formatClickCount(link: DashboardLink) {
  if (link.clickLimit != null) {
    return `${link.clickCount.toLocaleString()} / ${link.clickLimit.toLocaleString()}`;
  }
  return link.clickCount.toLocaleString();
}

function formatLimits(link: DashboardLink) {
  const parts: string[] = [];
  if (link.hasPassword) parts.push("Password protected");
  if (link.expiresAt) {
    parts.push(`Expires ${new Date(link.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
  }
  if (link.clickLimit != null) {
    parts.push(`Max ${link.clickLimit.toLocaleString()} clicks`);
  }
  return parts.join(" · ");
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

function LinkActions({ link, onEdit, onDelete, onToggle, onShowQr }: {
  link: DashboardLink;
  onEdit: (link: DashboardLink) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, status: LinkStatus) => void;
  onShowQr: (link: DashboardLink) => void;
}) {
  const router = useRouter();
  const shortUrl = buildShortUrl(link.domain, link.slug);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <MoreHorizontal size={15} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => router.push(`/dashboard/links/${link.id}/analytics`)}>
          <BarChart3 size={13} className="mr-2" /> View analytics
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(shortUrl); toast.success("Copied!"); }}>
          <Copy size={13} className="mr-2" /> Copy short URL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onShowQr(link)}>
          <QrCode size={13} className="mr-2" /> QR code
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(link)}>
          <Pencil size={13} className="mr-2" /> Edit link
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
  const [editLink, setEditLink] = useState<EditableLink | null>(null);
  const [qrLink, setQrLink] = useState<DashboardLink | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LinkStatusFilter>("all");
  const [sortBy, setSortBy] = useState<LinkSortOption>("newest");
  const [mutatingLinkIds, setMutatingLinkIds] = useState<Set<string>>(() => new Set());
  const debouncedSearch = useDebouncedValue(search, LINK_SEARCH_DEBOUNCE_MS);
  const queryClient = useQueryClient();

  const markLinkMutating = useCallback((id: string) => {
    setMutatingLinkIds((current) => new Set(current).add(id));
  }, []);

  const clearLinkMutating = useCallback((id: string) => {
    setMutatingLinkIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["links-summary"],
    queryFn: fetchLinksSummary,
  });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["links", debouncedSearch, statusFilter, sortBy],
    queryFn: ({ pageParam }) =>
      fetchLinksPage({
        page: pageParam,
        q: debouncedSearch,
        status: statusFilter,
        sort: sortBy,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

  const loadedLinks = useMemo(
    () => data?.pages.flatMap((page) => page.links) ?? [],
    [data]
  );

  const filteredTotal = data?.pages[0]?.total ?? 0;
  const hasActiveFilters = debouncedSearch.length > 0 || statusFilter !== "all";
  const isSearchPending = search !== debouncedSearch;
  const hasNoLinksEver = summary?.totalLinks === 0 && !isSummaryLoading;

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const deleteMutation = useMutation({
    mutationFn: deleteLink,
    onMutate: async (id) => {
      markLinkMutating(id);
      await cancelLinksQueries(queryClient);

      const previousLinks = snapshotLinksQueries(queryClient);
      const previousSummary = queryClient.getQueryData<LinksSummary>(["links-summary"]);
      const deletedLink = findLinkInCache(queryClient, id);

      removeLinkFromCache(queryClient, id);
      if (deletedLink) applySummaryDelete(queryClient, deletedLink);

      return { previousLinks, previousSummary, id };
    },
    onSuccess: () => {
      toast.success("Link deleted");
    },
    onError: (_error, id, context) => {
      if (context?.previousLinks) restoreLinksQueries(queryClient, context.previousLinks);
      if (context?.previousSummary) {
        queryClient.setQueryData(["links-summary"], context.previousSummary);
      }
      toast.error("Failed to delete link");
    },
    onSettled: (_data, _error, id) => {
      clearLinkMutating(id);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LinkStatus }) => toggleLink(id, status),
    onMutate: async ({ id, status }) => {
      markLinkMutating(id);
      await cancelLinksQueries(queryClient);

      const previousLinks = snapshotLinksQueries(queryClient);
      const previousSummary = queryClient.getQueryData<LinksSummary>(["links-summary"]);
      const nextStatus: LinkStatus = status === "active" ? "paused" : "active";

      updateLinkInCache(queryClient, id, (link) => ({ ...link, status: nextStatus }));
      applySummaryToggle(queryClient, status, nextStatus);

      return { previousLinks, previousSummary, id };
    },
    onError: (error, _variables, context) => {
      if (context?.previousLinks) restoreLinksQueries(queryClient, context.previousLinks);
      if (context?.previousSummary) {
        queryClient.setQueryData(["links-summary"], context.previousSummary);
      }
      const message = error instanceof Error ? error.message : "Failed to update link";
      toast.error(message, {
        duration: message.includes("Upgrade to Pro") ? 6000 : 4000,
        action: message.includes("Upgrade to Pro")
          ? { label: "View plans", onClick: () => { window.location.href = "/settings"; } }
          : undefined,
      });
    },
    onSettled: (_data, _error, variables) => {
      clearLinkMutating(variables.id);
    },
  });

  const editMutation = useMutation({
    mutationFn: updateLink,
    onMutate: async (variables) => {
      markLinkMutating(variables.id);
      await cancelLinksQueries(queryClient);

      const previousLinks = snapshotLinksQueries(queryClient);

      updateLinkInCache(queryClient, variables.id, (link) => ({
        ...link,
        destinationUrl: variables.destinationUrl,
        title: variables.title,
        expiresAt: variables.expiresAt,
        clickLimit: variables.clickLimit,
        hasPassword:
          variables.password !== undefined
            ? Boolean(variables.password)
            : link.hasPassword,
      }));

      return { previousLinks, id: variables.id };
    },
    onSuccess: (updatedLink) => {
      updateLinkInCache(queryClient, updatedLink.id, () => updatedLink);
      toast.success("Link updated");
      setEditLink(null);
    },
    onError: (_error, variables, context) => {
      if (context?.previousLinks) restoreLinksQueries(queryClient, context.previousLinks);
      toast.error("Failed to update link");
    },
    onSettled: (_data, _error, variables) => {
      clearLinkMutating(variables.id);
    },
  });

  const stats = [
    { label: "Total Links", value: (summary?.totalLinks ?? 0).toString(), icon: Link2 },
    { label: "Total Clicks", value: (summary?.totalClicks ?? 0).toLocaleString(), icon: MousePointerClick },
    { label: "Active Links", value: (summary?.activeLinks ?? 0).toString(), icon: Activity },
    {
      label: "Active Rate",
      value: (summary?.totalLinks ?? 0) > 0 ? `${summary?.activeRate ?? 0}%` : "N/A",
      icon: TrendingUp,
    },
  ];

  const handleCreated = useCallback((link: DashboardLink) => {
    addLinkToCache(queryClient, link, {
      q: debouncedSearch,
      status: statusFilter,
      sort: sortBy,
    });
    applySummaryCreate(queryClient);
    toast.success("Link created");
  }, [queryClient, debouncedSearch, statusFilter, sortBy]);

  const showTableLoading = isLoading || isSearchPending;

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
              {isSummaryLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/6" style={{ background: "oklch(0.12 0 0)" }}>
        <CardHeader className="px-6 pt-5 pb-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-foreground">All Links</CardTitle>
            {!showTableLoading && (
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters
                  ? `${loadedLinks.length} of ${filteredTotal} links`
                  : `${filteredTotal} links`}
                {hasNextPage ? " · scroll for more" : ""}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Search slug, title, or destination…"
                value={search}
                maxLength={LINK_SEARCH_MAX_LENGTH}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as LinkStatusFilter)}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as LinkSortOption)}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="clicks">Most clicks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
              {showTableLoading ? (
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
              ) : hasNoLinksEver ? (
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
              ) : loadedLinks.length === 0 ? (
                <TableRow className="border-white/6">
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                    No links match your filters.{" "}
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="font-medium transition-colors"
                      style={{ color: AMBER }}
                    >
                      Clear filters
                    </button>
                  </TableCell>
                </TableRow>
              ) : (
                loadedLinks.map((link) => (
                  <TableRow
                    key={link.id}
                    className={cn(
                      "border-white/6 hover:bg-white/2 group transition-opacity",
                      mutatingLinkIds.has(link.id) && "opacity-60",
                    )}
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">
                          {link.domain}/{link.slug}
                        </span>
                        <button
                          onClick={() => { navigator.clipboard.writeText(buildShortUrl(link.domain, link.slug)); toast.success("Copied!"); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy size={12} className="text-muted-foreground hover:text-foreground" />
                        </button>
                      </div>
                      {link.title && <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-45">{link.title}</p>}
                      {formatLimits(link) && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground/80 truncate max-w-45">
                          {link.hasPassword && <Lock size={11} className="shrink-0" />}
                          <span className="truncate">{formatLimits(link)}</span>
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="max-w-60 truncate block text-sm text-muted-foreground">
                        {link.destinationUrl}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-foreground">
                      {formatClickCount(link)}
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
                        onEdit={setEditLink}
                        onShowQr={setQrLink}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        onToggle={(id, status) => toggleMutation.mutate({ id, status })}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <InfiniteScrollSentinel
            hasMore={Boolean(hasNextPage)}
            isLoading={isFetchingNextPage}
            onLoadMore={handleLoadMore}
          />
        </div>
      </Card>

      <CreateLinkDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
      <EditLinkDialog
        link={editLink}
        open={editLink !== null}
        onOpenChange={(open) => { if (!open) setEditLink(null); }}
        isSaving={editMutation.isPending}
        onSave={async (values) => {
          if (!editLink) throw new Error("No link selected");
          await editMutation.mutateAsync({ id: editLink.id, ...values });
        }}
      />
      {qrLink && (
        <LinkQrDialog
          open={qrLink !== null}
          onOpenChange={(open) => { if (!open) setQrLink(null); }}
          domain={qrLink.domain}
          slug={qrLink.slug}
          title={qrLink.title}
        />
      )}
    </div>
  );
}
