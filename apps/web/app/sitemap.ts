import type { MetadataRoute } from "next";
import { SITEMAP_LAST_MODIFIED } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = SITEMAP_LAST_MODIFIED;
  const og = `${siteConfig.url}/og-image.png`;

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      images: [og],
    },
    {
      url: `${siteConfig.url}/sign-up`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}${siteConfig.legal.contact}`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteConfig.url}${siteConfig.legal.privacy}`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteConfig.url}${siteConfig.legal.terms}`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${siteConfig.url}${siteConfig.legal.deleteAccount}`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
