import type { Metadata } from "next"
import { siteConfig } from "@/lib/site"

/** Paths blocked in robots.txt — keep in sync with app/robots.ts */
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
  },
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
    },
    twitter: {
      title: fullTitle,
      description: options.description,
    },
    robots: index ? indexRobots : noIndexRobots,
  }
}

/** Stable sitemap timestamp — update when marketing pages change meaningfully */
export const SITEMAP_LAST_MODIFIED = new Date("2026-08-16")
