import { escapeLikePattern, normalizeSearchQuery, parsePageLimit, parsePageNumber } from "@/lib/filter-links";

export const ADMIN_USERS_PAGE_SIZE = 25;

export type AdminUserSortOption = "newest" | "oldest";

const SORT_VALUES = new Set<AdminUserSortOption>(["newest", "oldest"]);

export function parseAdminUserSort(value: string | null): AdminUserSortOption {
  if (value && SORT_VALUES.has(value as AdminUserSortOption)) {
    return value as AdminUserSortOption;
  }
  return "newest";
}

export interface AdminUsersListParams {
  q: string;
  sort: AdminUserSortOption;
  page: number;
  limit: number;
}

export function parseAdminUsersListParams(searchParams: URLSearchParams): AdminUsersListParams {
  return {
    q: normalizeSearchQuery(searchParams.get("q") ?? ""),
    sort: parseAdminUserSort(searchParams.get("sort")),
    page: parsePageNumber(searchParams.get("page")),
    limit: parsePageLimit(searchParams.get("limit") ?? String(ADMIN_USERS_PAGE_SIZE)),
  };
}

export function buildAdminUserSearchPattern(q: string): string | null {
  if (!q) return null;
  return `%${escapeLikePattern(q)}%`;
}
