import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/global/api/client";
import { queryKeys } from "@/global/api/query-keys";
import type { LinkSortOption, LinkStatusFilter } from "@/global/api/types";

type UseLinksInfiniteParams = {
  q: string;
  status: LinkStatusFilter;
  sort: LinkSortOption;
};

export function useLinksInfinite({ q, status, sort }: UseLinksInfiniteParams) {
  return useInfiniteQuery({
    queryKey: queryKeys.links.list({ q, status, sort }),
    queryFn: ({ pageParam }) =>
      apiClient.links.list({
        page: pageParam,
        q,
        status,
        sort,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });
}
