export const LINK_SEARCH_MAX_LENGTH = 100;
export const LINKS_PAGE_SIZE = 25;
export const LINKS_PAGE_SIZE_MAX = 50;
export const LINK_SEARCH_DEBOUNCE_MS = 370;

export type LinkStatusFilter = "all" | "active" | "paused" | "expired";
export type LinkSortOption = "newest" | "oldest" | "clicks";

const STATUS_VALUES = new Set<LinkStatusFilter>(["all", "active", "paused", "expired"]);
const SORT_VALUES = new Set<LinkSortOption>(["newest", "oldest", "clicks"]);

export function normalizeSearchQuery(input: string): string {
  return input.trim().slice(0, LINK_SEARCH_MAX_LENGTH);
}

/** Escape `%`, `_`, and `\` for SQL LIKE patterns */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

export function parseLinkStatusFilter(value: string | null): LinkStatusFilter {
  if (value && STATUS_VALUES.has(value as LinkStatusFilter)) {
    return value as LinkStatusFilter;
  }
  return "all";
}

export function parseLinkSortOption(value: string | null): LinkSortOption {
  if (value && SORT_VALUES.has(value as LinkSortOption)) {
    return value as LinkSortOption;
  }
  return "newest";
}

export function parsePageNumber(value: string | null): number {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(parsed, 10_000);
}

export function parsePageLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? String(LINKS_PAGE_SIZE), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return LINKS_PAGE_SIZE;
  return Math.min(parsed, LINKS_PAGE_SIZE_MAX);
}

export interface LinksListParams {
  q: string;
  status: LinkStatusFilter;
  sort: LinkSortOption;
  page: number;
  limit: number;
}

export function parseLinksListParams(searchParams: URLSearchParams): LinksListParams {
  return {
    q: normalizeSearchQuery(searchParams.get("q") ?? ""),
    status: parseLinkStatusFilter(searchParams.get("status")),
    sort: parseLinkSortOption(searchParams.get("sort")),
    page: parsePageNumber(searchParams.get("page")),
    limit: parsePageLimit(searchParams.get("limit")),
  };
}
