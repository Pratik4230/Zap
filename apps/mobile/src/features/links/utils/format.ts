import type { LinkSortOption, LinkStatus, LinkStatusFilter } from "@/global/api/types";

/** Match web `LINK_SEARCH_DEBOUNCE_MS`. */
export const LINK_SEARCH_DEBOUNCE_MS = 370;

export const STATUS_FILTERS: { value: LinkStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
];

export const SORT_OPTIONS: { value: LinkSortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "clicks", label: "Clicks" },
];

export function statusLabel(status: LinkStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "expired":
      return "Expired";
  }
}

export function buildShortUrl(domain: string, slug: string): string {
  return `https://${domain}/${slug}`;
}

export function formatClickCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

export function formatDateLabel(iso: string | null): string {
  if (!iso) return "No expiry";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString();
}
