/**
 * JSON shapes returned by https://xaply.in/api/*
 * Keep in sync with apps/web API routes (serialized Dates → ISO strings).
 */

export const LINKS_PAGE_SIZE = 25;

export type LinkStatus = "active" | "paused" | "expired";
export type LinkStatusFilter = "all" | LinkStatus;
export type LinkSortOption = "newest" | "oldest" | "clicks";
export type WorkspacePlan = "free" | "pro" | "business";
export type WorkspaceRole = "owner" | "admin" | "member";

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
  androidUrl?: string | null;
  androidStoreUrl?: string | null;
  iosUrl?: string | null;
  iosStoreUrl?: string | null;
  createdAt: string;
}

export interface LinksPageResponse {
  links: DashboardLink[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface LinksListParams {
  page?: number;
  limit?: number;
  q?: string;
  status?: LinkStatusFilter;
  sort?: LinkSortOption;
}

export interface LinksSummary {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  activeRate: number;
}

export interface CreateLinkInput {
  destinationUrl: string;
  slug?: string;
  title?: string;
  expiresAt?: string | null;
  clickLimit?: number | null;
  password?: string;
}

export interface UpdateLinkInput {
  status?: LinkStatus;
  title?: string | null;
  destinationUrl?: string;
  expiresAt?: string | null;
  clickLimit?: number | null;
  password?: string | null;
  androidUrl?: string | null;
  androidStoreUrl?: string | null;
  iosUrl?: string | null;
  iosStoreUrl?: string | null;
}

export interface ProfileUser {
  id: string;
  name: string;
  email: string;
}

export interface AnalyticsPoint {
  date: string;
  label: string;
  clicks: number;
}

export interface CountRow {
  label: string;
  count: number;
}

export interface DeviceBreakdown {
  device: string;
  count: number;
  pct: number;
}

export interface AccountAnalytics {
  daily: AnalyticsPoint[];
  totalClicks: number;
  topLinks: {
    slug: string;
    domain: string;
    title: string | null;
    clicks: number;
  }[];
  countries: { country: string; count: number }[];
  cities: CountRow[];
  devices: DeviceBreakdown[];
  plan: WorkspacePlan;
  rangeDays: number;
  maxRangeDays: number;
  rangeLabel: string;
}

export interface LinkAnalytics {
  link: {
    id: string;
    slug: string;
    domain: string;
    destinationUrl: string;
    title: string | null;
    status: string;
    clickCount: number;
    clickLimit: number | null;
    expiresAt: string | null;
    createdAt: string;
  };
  daily: AnalyticsPoint[];
  totalClicks: number;
  countries: CountRow[];
  cities: CountRow[];
  devices: DeviceBreakdown[];
  browsers: CountRow[];
  os: CountRow[];
  referrers: CountRow[];
  plan: WorkspacePlan;
  rangeDays: number;
  maxRangeDays: number;
  rangeLabel: string;
}

export interface StreakStatus {
  streak: number;
  hasClaimedReward: boolean;
  canClaim: boolean;
  proGrantedUntil: string | null; // ISO date string
}

export interface WorkspaceListItem {
  id: string;
  name: string;
  plan: WorkspacePlan;
  role: WorkspaceRole;
  isOwner: boolean;
  usable: boolean;
}

export interface WorkspaceCurrent {
  workspaceId: string;
  workspaceName: string;
  plan: WorkspacePlan;
  role: WorkspaceRole;
  isOwner: boolean;
}

export interface WorkspaceResponse {
  current: WorkspaceCurrent;
  workspaces: WorkspaceListItem[];
  limits: {
    ownedCount: number;
    maxOwned: number;
    membershipCount: number;
    maxMemberships: number;
    canCreate: boolean;
  };
}

export const WEBHOOK_EVENTS = [
  "link.created",
  "link.updated",
  "link.deleted",
  "link.clicked",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
  name: string;
  email: string;
  createdAt: string;
}

export interface WorkspaceInvite {
  id: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  expiresAt: string;
  createdAt: string;
}

export interface WorkspaceMembersResponse {
  workspace: {
    id: string;
    name: string;
    plan: WorkspacePlan;
    role: WorkspaceRole;
    isOwner: boolean;
  };
  members: WorkspaceMember[];
  invites: WorkspaceInvite[];
  seats: {
    used: number;
    max: number;
  };
}

export interface WorkspaceWebhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  lastDeliveredAt: string | null;
  lastError: string | null;
  createdAt: string;
  secret?: string;
}

export interface WorkspaceWebhooksResponse {
  events: WebhookEvent[];
  webhooks: WorkspaceWebhook[];
}

export interface InvitePreview {
  workspaceName: string;
  email: string;
  role: WorkspaceRole;
  matchesAccount: boolean;
}

export function canManageTeam(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

export function canManageWebhooks(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}
