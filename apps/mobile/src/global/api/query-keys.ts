import type { LinkSortOption, LinkStatusFilter } from "@/global/api/types";

/** Stable TanStack Query keys for mobile API data. */
export const queryKeys = {
  links: {
    all: ["links"] as const,
    summaryRoot: ["links", "summary"] as const,
    summary: (workspaceId: string) => ["links", "summary", workspaceId] as const,
    list: (filters: {
      q: string;
      status: LinkStatusFilter;
      sort: LinkSortOption;
      workspaceId: string;
    }) => ["links", "list", filters] as const,
    detail: (id: string) => ["links", "detail", id] as const,
    analytics: (id: string, rangeDays: number | "auto", workspaceId: string) =>
      ["links", "analytics", id, rangeDays, workspaceId] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    account: (rangeDays: number | "auto", workspaceId: string) =>
      ["analytics", "account", rangeDays, workspaceId] as const,
  },
  billing: ["billing"] as const,
  workspace: ["workspace"] as const,
  workspaceMembers: (workspaceId: string) =>
    ["workspace", "members", workspaceId] as const,
  workspaceWebhooks: (workspaceId: string) =>
    ["workspace", "webhooks", workspaceId] as const,
  invite: (token: string) => ["invite", token] as const,
  profile: ["profile"] as const,
  streak: ["streak"] as const,
} as const;
