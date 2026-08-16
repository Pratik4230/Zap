import { api } from "@/global/api/http";
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
  type InvitePreview,
  type WorkspaceMembersResponse,
  type WorkspacePlan,
  type WorkspaceResponse,
  type WorkspaceRole,
  type WorkspaceWebhook,
  type WorkspaceWebhooksResponse,
  type StreakStatus,
  type WebhookEvent,
} from "@/global/api/types";

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

  workspace: {
    get(): Promise<WorkspaceResponse> {
      return api.get<WorkspaceResponse>("/api/workspace").then((res) => res.data);
    },
    select(workspaceId: string): Promise<void> {
      return api
        .post("/api/workspace", { workspaceId })
        .then(() => undefined);
    },
    create(name: string): Promise<{ id: string; name: string }> {
      return api
        .post<{ ok: true; workspace: { id: string; name: string } }>(
          "/api/workspace/create",
          { name }
        )
        .then((res) => res.data.workspace);
    },
    rename(name: string): Promise<void> {
      return api
        .patch("/api/workspace", { name })
        .then(() => undefined);
    },
    delete(id: string): Promise<{ workspaceId: string }> {
      return api
        .delete<{ ok: true; workspaceId: string }>(`/api/workspace/${id}`)
        .then((res) => res.data);
    },
    members(): Promise<WorkspaceMembersResponse> {
      return api
        .get<WorkspaceMembersResponse>("/api/workspace/members")
        .then((res) => res.data);
    },
    updateMemberRole(userId: string, role: Exclude<WorkspaceRole, "owner">) {
      return api
        .patch<{ member: { userId: string; role: WorkspaceRole } }>(
          `/api/workspace/members/${userId}`,
          { role }
        )
        .then((res) => res.data.member);
    },
    removeMember(userId: string): Promise<void> {
      return api
        .delete(`/api/workspace/members/${userId}`)
        .then(() => undefined);
    },
    invite(email: string, role: Exclude<WorkspaceRole, "owner">): Promise<void> {
      return api
        .post("/api/workspace/invites", { email, role })
        .then(() => undefined);
    },
    revokeInvite(id: string): Promise<void> {
      return api
        .delete(`/api/workspace/invites/${id}`)
        .then(() => undefined);
    },
    webhooks: {
      list(): Promise<WorkspaceWebhooksResponse> {
        return api
          .get<WorkspaceWebhooksResponse>("/api/workspace/webhooks")
          .then((res) => res.data);
      },
      create(input: { url: string; events: WebhookEvent[] }) {
        return api
          .post<{ webhook: WorkspaceWebhook }>("/api/workspace/webhooks", input)
          .then((res) => res.data.webhook);
      },
      update(
        id: string,
        input: { url?: string; events?: WebhookEvent[]; enabled?: boolean }
      ) {
        return api
          .patch<{ webhook: WorkspaceWebhook }>(
            `/api/workspace/webhooks/${id}`,
            input
          )
          .then((res) => res.data.webhook);
      },
      delete(id: string): Promise<void> {
        return api
          .delete(`/api/workspace/webhooks/${id}`)
          .then(() => undefined);
      },
      rotate(id: string): Promise<string> {
        return api
          .post<{ secret: string }>(`/api/workspace/webhooks/${id}/rotate`)
          .then((res) => res.data.secret);
      },
      test(id: string): Promise<void> {
        return api
          .post(`/api/workspace/webhooks/${id}/test`)
          .then(() => undefined);
      },
    },
  },

  invite: {
    preview(token: string): Promise<InvitePreview> {
      return api.get<InvitePreview>(`/api/invite/${token}`).then((res) => res.data);
    },
    accept(token: string): Promise<{ workspaceId: string }> {
      return api
        .post<{ ok: true; workspaceId: string }>(`/api/invite/${token}`)
        .then((res) => res.data);
    },
  },

  profile: {
    update(name: string): Promise<ProfileUser> {
      return api
        .patch<{ user: ProfileUser }>("/api/profile", { name })
        .then((res) => res.data.user);
    },
  },

  push: {
    registerToken(token: string, platform: "android" | "ios" | "unknown") {
      return api
        .post<{ ok: true }>("/api/push/token", { token, platform })
        .then((res) => res.data);
    },
  },

  streak: {
    ping(): Promise<StreakStatus> {
      return api
        .post<StreakStatus>("/api/streak/ping", {})
        .then((res) => res.data);
    },
    status(): Promise<StreakStatus> {
      return api
        .get<StreakStatus>("/api/streak/status")
        .then((res) => res.data);
    },
    claim(): Promise<{ success: true; proGrantedUntil: string }> {
      return api
        .post<{ success: true; proGrantedUntil: string }>("/api/streak/claim", {})
        .then((res) => res.data);
    },
  },
};
