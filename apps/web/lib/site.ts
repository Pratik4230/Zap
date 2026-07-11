import type { Metadata } from "next";
import { APP_DOMAIN, APP_URL, SHORT_LINK_DOMAIN } from "@xaply/db";

export const siteConfig = {
  name: "Xaply",
  appIcon: "/icon-192.png",
  title: "Xaply | Fast URL Shortener with Analytics",
  tagline: "Short links that move fast",
  description:
    "Xaply is a free URL shortener with real-time analytics, QR codes, password protection, and edge-fast redirects on go.xaply.in. Built for creators, marketers, and developers.",
  url: APP_URL,
  appDomain: APP_DOMAIN,
  shortLinkDomain: SHORT_LINK_DOMAIN,
  keywords: [
    "url shortener",
    "link shortener",
    "short links",
    "link analytics",
    "qr code shortener",
    "password protected links",
    "cloudflare url shortener",
    "free url shortener",
    "xaply",
  ],
  owner: {
    name: "Pratik Jadhav",
    linkedin: "https://www.linkedin.com/in/pratikjadhav1438/",
    twitter: "https://x.com/Pratik4230",
    twitterHandle: "@Pratik4230",
  },
} as const;

export const siteMetadata: Metadata = {
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
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Fast URL Shortener with Analytics`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    creator: siteConfig.owner.twitterHandle,
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
