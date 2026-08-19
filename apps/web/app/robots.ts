import type { MetadataRoute } from "next";
import { PRIVATE_PATHS } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

const disallow = [...PRIVATE_PATHS];
const publicAllow = ["/", "/sign-up", "/contact", "/privacy", "/terms", "/llms.txt"];

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
        allow: publicAllow,
        disallow,
      },
      {
        userAgent: "ChatGPT-User",
        allow: publicAllow,
        disallow,
      },
      {
        userAgent: "ClaudeBot",
        allow: publicAllow,
        disallow,
      },
      {
        userAgent: "Google-Extended",
        allow: publicAllow,
        disallow,
      },
      {
        userAgent: "PerplexityBot",
        allow: publicAllow,
        disallow,
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
