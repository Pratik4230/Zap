import { api } from "@/api/http";
import {
  LINKS_PAGE_SIZE,
  type AccountAnalytics,
  type CreateLinkInput,
  type DashboardLink,
  type LinkAnalytics,
  type LinksListParams,
  type LinksPageResponse,
  type LinksSummary,
  type ProfileUser,
  type UpdateLinkInput,
  type WorkspacePlan,
} from "@/api/types";

/** Typed wrappers around production `/api/*` routes. */
export const apiClient = {
  links: {
    list(params: LinksListParams = {}): Promise<LinksPageResponse> {
      const search = new URLSearchParams({
        page: String(params.page ?? 1),
        limit: String(params.limit ?? LINKS_PAGE_SIZE),
        status: params.status ?? "all",
        sort: params.sort ?? "newest",
      });
      const q = params.q?.trim();
      if (q) search.set("q", q);

      return api
        .get<LinksPageResponse>(`/api/links?${search}`)
        .then((res) => res.data);
    },

    summary(): Promise<LinksSummary> {
      return api.get<LinksSummary>("/api/links/summary").then((res) => res.data);
    },

    create(input: CreateLinkInput): Promise<DashboardLink> {
      return api
        .post<{ link: DashboardLink }>("/api/links", input)
        .then((res) => res.data.link);
    },

    update(id: string, input: UpdateLinkInput): Promise<DashboardLink> {
      return api
        .patch<{ link: DashboardLink }>(`/api/links/${id}`, input)
        .then((res) => res.data.link);
    },

    delete(id: string): Promise<void> {
      return api.delete(`/api/links/${id}`).then(() => undefined);
    },

    analytics(id: string, rangeDays?: number): Promise<LinkAnalytics> {
      const query = rangeDays != null ? `?range=${rangeDays}` : "";
      return api
        .get<LinkAnalytics>(`/api/links/${id}/analytics${query}`)
        .then((res) => res.data);
    },
  },

  analytics: {
    account(rangeDays?: number): Promise<AccountAnalytics> {
      const query = rangeDays != null ? `?range=${rangeDays}` : "";
      return api
        .get<AccountAnalytics>(`/api/analytics${query}`)
        .then((res) => res.data);
    },
  },

  billing: {
    plan(): Promise<WorkspacePlan> {
      return api
        .get<{ plan: WorkspacePlan }>("/api/billing")
        .then((res) => res.data.plan);
    },
  },

  profile: {
    update(name: string): Promise<ProfileUser> {
      return api
        .patch<{ user: ProfileUser }>("/api/profile", { name })
        .then((res) => res.data.user);
    },
  },
};
