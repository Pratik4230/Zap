import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/global/api/query-keys";
import type { DashboardLink, LinksPageResponse } from "@/global/api/types";

function mapPages(
  oldData: InfiniteData<LinksPageResponse> | undefined,
  updater: (link: DashboardLink) => DashboardLink | null
): InfiniteData<LinksPageResponse> | undefined {
  if (!oldData) return oldData;

  const pages = oldData.pages.map((page) => {
    const nextLinks = page.links
      .map(updater)
      .filter((link): link is DashboardLink => link !== null);
    return {
      ...page,
      links: nextLinks,
      total: nextLinks.length === page.links.length ? page.total : Math.max(0, page.total - 1),
    };
  });

  return { ...oldData, pages };
}

export function findLinkInCache(queryClient: QueryClient, linkId: string): DashboardLink | undefined {
  const cached = queryClient.getQueriesData<InfiniteData<LinksPageResponse>>({
    queryKey: queryKeys.links.all,
  });

  for (const [, data] of cached) {
    const found = data?.pages.flatMap((page) => page.links).find((link) => link.id === linkId);
    if (found) return found;
  }

  return undefined;
}

export function upsertLinkInCache(queryClient: QueryClient, updated: DashboardLink) {
  queryClient.setQueriesData<InfiniteData<LinksPageResponse>>(
    { queryKey: queryKeys.links.all },
    (oldData) =>
      mapPages(oldData, (link) => {
        if (link.id !== updated.id) return link;
        return updated;
      })
  );
}

export function removeLinkFromCache(queryClient: QueryClient, linkId: string) {
  queryClient.setQueriesData<InfiniteData<LinksPageResponse>>(
    { queryKey: queryKeys.links.all },
    (oldData) =>
      mapPages(oldData, (link) => {
        if (link.id !== linkId) return link;
        return null;
      })
  );
}
