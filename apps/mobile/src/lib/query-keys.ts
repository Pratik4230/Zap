import type { LinkSortOption, LinkStatusFilter } from "./api-types";

/**
 * Stable TanStack Query keys for mobile API data.
 */
export const queryKeys = {
  links: {
    all: ["links"] as const,
    summary: ["links", "summary"] as const,
    list: (filters: {
      q: string;
      status: LinkStatusFilter;
      sort: LinkSortOption;
    }) => ["links", "list", filters] as const,
    detail: (id: string) => ["links", "detail", id] as const,
    analytics: (id: string, rangeDays: number | "auto") =>
      ["links", "analytics", id, rangeDays] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    account: (rangeDays: number | "auto") =>
      ["analytics", "account", rangeDays] as const,
  },
  billing: ["billing"] as const,
  profile: ["profile"] as const,
} as const;
