import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";
import type { LinkSortOption, LinkStatusFilter } from "@/lib/filter-links";

export type LinkStatus = "active" | "paused" | "expired";

export interface DashboardLink {
  id: string;
  slug: string;
  domain: string;
  destinationUrl: string;
  title: string | null;
  clickCount: number;
  clickLimit: number | null;
  expiresAt: string | null;
  status: LinkStatus;
  hasPassword: boolean;
  createdAt: string;
}

export interface LinksPageResponse {
  links: DashboardLink[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface LinksSummary {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  activeRate: number;
}

type LinksInfiniteData = InfiniteData<LinksPageResponse, number>;

function recalculateActiveRate(summary: LinksSummary): LinksSummary {
  return {
    ...summary,
    activeRate:
      summary.totalLinks > 0
        ? Math.round((summary.activeLinks / summary.totalLinks) * 100)
        : 0,
  };
}

export function findLinkInCache(queryClient: QueryClient, id: string): DashboardLink | undefined {
  const queries = queryClient.getQueriesData<LinksInfiniteData>({ queryKey: ["links"] });

  for (const [, data] of queries) {
    if (!data) continue;
    for (const page of data.pages) {
      const link = page.links.find((item) => item.id === id);
      if (link) return link;
    }
  }

  return undefined;
}

export function snapshotLinksQueries(queryClient: QueryClient) {
  return queryClient.getQueriesData<LinksInfiniteData>({ queryKey: ["links"] });
}

export function restoreLinksQueries(
  queryClient: QueryClient,
  snapshots: Array<[QueryKey, LinksInfiniteData | undefined]>,
) {
  for (const [key, data] of snapshots) {
    queryClient.setQueryData(key, data);
  }
}

export function patchAllLinksQueries(
  queryClient: QueryClient,
  patchPages: (pages: LinksPageResponse[]) => LinksPageResponse[],
) {
  queryClient.setQueriesData<LinksInfiniteData>({ queryKey: ["links"] }, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: patchPages(old.pages),
    };
  });
}

export function removeLinkFromCache(queryClient: QueryClient, id: string) {
  patchAllLinksQueries(queryClient, (pages) =>
    pages.map((page, index) => {
      const hadLink = page.links.some((link) => link.id === id);
      return {
        ...page,
        links: page.links.filter((link) => link.id !== id),
        total: hadLink && index === 0 ? Math.max(0, page.total - 1) : page.total,
      };
    }),
  );
}

export function updateLinkInCache(
  queryClient: QueryClient,
  id: string,
  updater: (link: DashboardLink) => DashboardLink,
) {
  patchAllLinksQueries(queryClient, (pages) =>
    pages.map((page) => ({
      ...page,
      links: page.links.map((link) => (link.id === id ? updater(link) : link)),
    })),
  );
}

function linkMatchesSearch(link: DashboardLink, q: string) {
  if (!q) return true;
  const haystack = `${link.slug} ${link.title ?? ""} ${link.destinationUrl} ${link.domain}`.toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function linkMatchesStatus(link: DashboardLink, status: LinkStatusFilter) {
  return status === "all" || link.status === status;
}

function insertCreatedLink(pages: LinksPageResponse[], link: DashboardLink, sort: LinkSortOption) {
  if (pages.length === 0) {
    return [
      {
        links: [link],
        page: 1,
        limit: 25,
        total: 1,
        hasMore: false,
      },
    ];
  }

  if (sort === "oldest") {
    const lastIndex = pages.length - 1;
    const lastPage = pages[lastIndex];
    const nextPages = [...pages];
    nextPages[lastIndex] = {
      ...lastPage,
      links: [...lastPage.links, link],
      total: pages[0].total + 1,
    };
    return nextPages;
  }

  const firstPage = pages[0];
  const nextLinks =
    sort === "clicks"
      ? [...firstPage.links, link].sort((a, b) => b.clickCount - a.clickCount)
      : [link, ...firstPage.links];

  return [
    {
      ...firstPage,
      links: nextLinks,
      total: firstPage.total + 1,
    },
    ...pages.slice(1),
  ];
}

export function addLinkToCache(
  queryClient: QueryClient,
  link: DashboardLink,
  filters: { q: string; status: LinkStatusFilter; sort: LinkSortOption },
) {
  if (!linkMatchesSearch(link, filters.q) || !linkMatchesStatus(link, filters.status)) {
    return;
  }

  const key = ["links", filters.q, filters.status, filters.sort] as const;
  queryClient.setQueryData<LinksInfiniteData>(key, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: insertCreatedLink(old.pages, link, filters.sort),
    };
  });
}

export function applySummaryDelete(queryClient: QueryClient, link: DashboardLink) {
  queryClient.setQueryData<LinksSummary>(["links-summary"], (old) => {
    if (!old) return old;

    return recalculateActiveRate({
      ...old,
      totalLinks: Math.max(0, old.totalLinks - 1),
      totalClicks: Math.max(0, old.totalClicks - link.clickCount),
      activeLinks: link.status === "active" ? Math.max(0, old.activeLinks - 1) : old.activeLinks,
    });
  });
}

export function applySummaryCreate(queryClient: QueryClient) {
  queryClient.setQueryData<LinksSummary>(["links-summary"], (old) => {
    if (!old) return old;

    return recalculateActiveRate({
      ...old,
      totalLinks: old.totalLinks + 1,
      activeLinks: old.activeLinks + 1,
    });
  });
}

export function applySummaryToggle(
  queryClient: QueryClient,
  previousStatus: LinkStatus,
  nextStatus: LinkStatus,
) {
  if (previousStatus === nextStatus) return;

  queryClient.setQueryData<LinksSummary>(["links-summary"], (old) => {
    if (!old) return old;

    let activeLinks = old.activeLinks;
    if (previousStatus === "active") activeLinks -= 1;
    if (nextStatus === "active") activeLinks += 1;

    return recalculateActiveRate({
      ...old,
      activeLinks: Math.max(0, activeLinks),
    });
  });
}

export async function cancelLinksQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.cancelQueries({ queryKey: ["links"] }),
    queryClient.cancelQueries({ queryKey: ["links-summary"] }),
  ]);
}
