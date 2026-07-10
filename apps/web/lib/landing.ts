import {
  BarChart3,
  Gauge,
  Globe,
  Lock,
  MousePointerClick,
  QrCode,
  Shield,
  Shuffle,
  Smartphone,
} from "lucide-react";

export const AMBER = "oklch(0.769 0.188 70.08)";
export const AMBER_DIM = "oklch(0.769 0.188 70.08 / 15%)";
export const AMBER_BORDER = "oklch(0.769 0.188 70.08 / 30%)";

export const HERO_STATS = [
  { label: "Redirect latency", value: "<10ms" },
  { label: "Edge locations", value: "300+" },
  { label: "Starting price", value: "$0" },
] as const;

export const HIGHLIGHTS = [
  {
    icon: Globe,
    tag: "Global reach",
    title: "Worldwide",
    hook: "Your audience clicks. The redirect happens next door.",
    description:
      "Every short link resolves on Cloudflare's edge network, not a single far-away server.",
    points: ["300+ cities covered", "Geo analytics built in", "No cold starts ever"],
  },
  {
    icon: Gauge,
    tag: "Performance",
    title: "Speed",
    hook: "Sub-10ms redirects your users will never notice.",
    description:
      "Hot slugs stay in KV cache. Visitors hit your destination before they can blink.",
    points: ["KV-cached slugs", "Lightweight workers", "Zero spinner pages"],
  },
  {
    icon: Smartphone,
    tag: "Mobile first",
    title: "Open in app",
    hook: "Share once. Works on phone, tablet, and desktop.",
    description:
      "Clean redirects on every device, with click breakdowns for iOS, Android, and web.",
    points: ["Mobile-ready links", "Device analytics", "QR codes in one click"],
  },
] as const;

export const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Edge-fast redirects",
    hook: "Stop losing clicks to slow redirects.",
    description:
      "Long URLs become go.xaply.in links that resolve in milliseconds, anywhere on earth.",
    points: ["Cloudflare Workers at the edge", "Automatic HTTPS", "Pause or resume anytime"],
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    hook: "Know who clicked, where, and when.",
    description:
      "See the last 7 days of traffic with countries, cities, devices, browsers, and referrers.",
    points: ["Global and per-link views", "Top cities and countries", "Device and OS breakdown"],
  },
  {
    icon: Shuffle,
    title: "Custom slugs",
    hook: "Your link, your name.",
    description:
      "Pick a memorable slug for campaigns or let Xaply generate a short one instantly.",
    points: ["Brand-friendly URLs", "Collision-safe generation", "Edit anytime"],
  },
  {
    icon: Shield,
    title: "Link controls",
    hook: "Full control over every link you share.",
    description:
      "Set expiry dates, click limits, or pause a link the moment a campaign ends.",
    points: ["Expiry by date or clicks", "One-click pause", "Safe delete"],
  },
  {
    icon: Lock,
    title: "Password protection",
    hook: "Share sensitive links with confidence.",
    description:
      "Visitors enter a password before the redirect. You keep the destination private.",
    points: ["Hashed passwords", "Gate before redirect", "Toggle on any link"],
  },
  {
    icon: QrCode,
    title: "QR codes",
    hook: "Offline to online in one scan.",
    description:
      "Generate QR codes in the browser for posters, packaging, or events. Nothing uploaded.",
    points: ["Instant generation", "Works with any slug", "Nothing stored on servers"],
  },
] as const;

export const STEPS = [
  {
    number: "01",
    title: "Paste your URL",
    description: "Drop any long URL into the dashboard. We validate and shorten it instantly.",
  },
  {
    number: "02",
    title: "Share your short link",
    description: "Copy go.xaply.in/your-slug and share it anywhere. Add a QR code if you need one.",
  },
  {
    number: "03",
    title: "Watch the clicks roll in",
    description: "Open analytics to see countries, cities, devices, and referrers in real time.",
  },
] as const;

export const FREE_TIER = [
  "Unlimited short links",
  "7-day click analytics",
  "Custom slugs",
  "QR codes",
  "Password-protected links",
  "Expiry dates and click limits",
  "No credit card required",
] as const;

export const FAQ = [
  {
    q: "Is Xaply free?",
    a: "Yes. The free tier includes unlimited short links, full link management, analytics, QR codes, password protection, and expiry controls. No credit card required.",
  },
  {
    q: "What does runs on Cloudflare Edge mean?",
    a: "Xaply is built on Cloudflare Workers and KV for redirects. That is the infrastructure we use, not a sponsorship. Your links resolve close to visitors worldwide for low latency.",
  },
  {
    q: "Can I use my own domain?",
    a: "All short links use go.xaply.in. Custom domains are not on our roadmap.",
  },
  {
    q: "What analytics are included?",
    a: "See clicks over the last 7 days, top countries and cities, devices, browsers, operating systems, and referrers. Per-link analytics are available in the dashboard.",
  },
  {
    q: "Who is Xaply for?",
    a: "Creators, marketers, founders, and developers who want fast short links with honest analytics and no bloat.",
  },
] as const;
