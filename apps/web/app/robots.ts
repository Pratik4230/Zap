import type { MetadataRoute } from "next";
import { PRIVATE_PATHS } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

const disallow = [...PRIVATE_PATHS];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/sign-up"],
        disallow,
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/sign-up"],
        disallow,
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/sign-up"],
        disallow,
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/sign-up"],
        disallow,
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/", "/sign-up"],
        disallow,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
