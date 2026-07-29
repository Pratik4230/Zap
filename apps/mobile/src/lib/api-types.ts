/**
 * JSON shapes returned by https://xaply.in/api/*
 * Keep in sync with apps/web API routes (serialized Dates → ISO strings).
 */

export const LINKS_PAGE_SIZE = 25;

export type LinkStatus = "active" | "paused" | "expired";
export type LinkStatusFilter = "all" | LinkStatus;
export type LinkSortOption = "newest" | "oldest" | "clicks";
export type WorkspacePlan = "free" | "pro";

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
  /** Pass `null` or `""` to clear; omit to leave unchanged. */
  password?: string | null;
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
