import { siteConfig } from "@/lib/site";

/** Bump when legal copy changes meaningfully */
export const LEGAL_LAST_UPDATED = "July 31, 2026";

export const LEGAL_OPERATOR = {
  name: siteConfig.owner.name,
  product: siteConfig.name,
  email: siteConfig.supportEmail,
  location: "Pune, India",
  websites: [siteConfig.appDomain, siteConfig.shortLinkDomain] as const,
} as const;
