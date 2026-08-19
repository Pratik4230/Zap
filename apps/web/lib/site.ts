import type { Metadata } from "next";
import { APP_DOMAIN, APP_URL, SHORT_LINK_DOMAIN } from "@xaply/db";

export const siteConfig = {
  name: "Xaply",
  appIcon: "/icon-192.png",
  title: "Xaply | Free URL Shortener with the Fastest Redirects",
  tagline: "Short links that move fast",
  description:
    "Xaply is a free URL shortener with the fastest Cloudflare edge redirects, real-time analytics, QR codes, and a Business plan for teams: workspaces, 50 seats, and webhooks. Built for creators, marketers, and companies.",
  url: APP_URL,
  copyrightYear: 2026,
  appDomain: APP_DOMAIN,
  shortLinkDomain: SHORT_LINK_DOMAIN,
  keywords: [
    "what is xaply",
    "xaply",
    "best url shortener",
    "best url shortner",
    "free url shortener",
    "free url shortner",
    "fastest redirect url shortener",
    "fastest url shortener",
    "url shortener for business",
    "url shortner for business",
    "business url shortener",
    "url shortener",
    "url shortner",
    "link shortener",
    "short links",
    "link analytics",
    "qr code shortener",
    "password protected links",
    "cloudflare url shortener",
    "team url shortener",
    "workspace url shortener",
  ],
  owner: {
    name: "Pratik Jadhav",
    linkedin: "https://www.linkedin.com/in/pratikjadhav1438/",
    twitter: "https://x.com/Pratik4230",
    twitterHandle: "@Pratik4230",
  },
  supportEmail: "pratikjadhav9534@gmail.com",
  legal: {
    privacy: "/privacy",
    terms: "/terms",
    contact: "/contact",
    deleteAccount: "/delete-account",
  },
  /** Closed-beta Android APK landing page (binary on Google Drive, not in git). */
  android: "/android",
} as const;

const sharedMetadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.owner.name, url: siteConfig.owner.linkedin }],
  creator: siteConfig.owner.name,
  publisher: siteConfig.owner.name,
  applicationName: siteConfig.name,
  category: "technology",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website" as const,
    locale: "en_US",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Xaply: free URL shortener with the fastest redirects and a Business plan for teams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: siteConfig.title,
    description: siteConfig.description,
    site: siteConfig.owner.twitterHandle,
    creator: siteConfig.owner.twitterHandle,
    images: [
      {
        url: "/og-image.png",
        alt: "Xaply: free URL shortener with the fastest redirects and a Business plan for teams",
      },
    ],
  },
  manifest: "/manifest.json",
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  referrer: "origin-when-cross-origin" as const,
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "black-translucent" as const,
  },
};

/** Root layout defaults. Child routes set their own canonical. */
export const baseMetadata: Metadata = sharedMetadata;

/** Homepage: indexable with canonical */
export const homeMetadata: Metadata = {
  ...sharedMetadata,
  alternates: {
    canonical: siteConfig.url,
    types: {
      "text/plain": [{ url: "/llms.txt", title: "LLM site summary" }],
    },
  },
  openGraph: {
    ...sharedMetadata.openGraph,
    url: siteConfig.url,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

/** @deprecated Use homeMetadata or createPageMetadata */
export const siteMetadata = homeMetadata;
