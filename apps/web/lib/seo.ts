import type { Metadata } from "next"
import { siteConfig } from "@/lib/site"

/** Paths blocked in robots.txt. Keep in sync with app/robots.ts */
export const PRIVATE_PATHS = [
  "/dashboard/",
  "/analytics/",
  "/workspaces/",
  "/settings/",
  "/invite/",
  "/api/",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
}

export const indexRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
}

const ogImage = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Xaply: free URL shortener with the fastest redirects and a Business plan for teams",
}

export function createPageMetadata(options: {
  title: string
  description: string
  path: string
  index?: boolean
}): Metadata {
  const url = `${siteConfig.url}${options.path}`
  const index = options.index ?? false
  const fullTitle = `${options.title} | ${siteConfig.name}`

  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description: options.description,
      url,
      type: "website",
      siteName: siteConfig.name,
      locale: "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: options.description,
      images: [{ url: ogImage.url, alt: ogImage.alt }],
    },
    robots: index ? indexRobots : noIndexRobots,
  }
}

/** Stable sitemap timestamp. Update when marketing pages change meaningfully. */
export const SITEMAP_LAST_MODIFIED = new Date("2026-08-19")
