import type { MetadataRoute } from "next";
import { SITEMAP_LAST_MODIFIED } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/sign-up`,
      lastModified: SITEMAP_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
