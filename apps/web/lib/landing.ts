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
} from "lucide-react"

export const AMBER = "oklch(0.769 0.188 70.08)"
export const AMBER_DIM = "oklch(0.769 0.188 70.08 / 15%)"
export const AMBER_BORDER = "oklch(0.769 0.188 70.08 / 30%)"

export const HERO_STATS = [
  { label: "Redirect latency", value: "<10ms" },
  { label: "Edge locations", value: "300+" },
  { label: "Starting price", value: "$0" },
] as const

export const HIGHLIGHTS = [
  {
    icon: Globe,
    tag: "Global reach",
    title: "Worldwide",
    hook: "Your audience clicks. The redirect happens next door.",
    description:
      "Every short link resolves on Cloudflare's edge network, not a single far-away server.",
    points: [
      "300+ cities covered",
      "Geo analytics built in",
      "No cold starts ever",
    ],
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
] as const

export const FEATURES = [
  {
    icon: MousePointerClick,
    title: "Edge-fast redirects",
    hook: "Stop losing clicks to slow redirects.",
    description:
      "Long URLs become go.xaply.in links that resolve in milliseconds, anywhere on earth.",
    points: [
      "Cloudflare Workers at the edge",
      "Automatic HTTPS",
      "Pause or resume anytime",
    ],
  },
  {
    icon: BarChart3,
    title: "Real-time analytics",
    hook: "Know who clicked, where, and when.",
    description:
      "See the last 7 days of traffic with countries, cities, devices, browsers, and referrers.",
    points: [
      "Global and per-link views",
      "Top cities and countries",
      "Device and OS breakdown",
    ],
  },
  {
    icon: Shuffle,
    title: "Custom slugs",
    hook: "Your link, your name.",
    description:
      "Pick a memorable slug for campaigns or let Xaply generate a short one instantly.",
    points: [
      "Brand-friendly URLs",
      "Collision-safe generation",
      "Edit anytime",
    ],
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
    points: [
      "Instant generation",
      "Works with any slug",
      "Nothing stored on servers",
    ],
  },
] as const

export const STEPS = [
  {
    number: "01",
    title: "Paste your URL",
    description:
      "Drop any long URL into the dashboard. We validate and shorten it instantly.",
  },
  {
    number: "02",
    title: "Share your short link",
    description:
      "Copy go.xaply.in/your-slug and share it anywhere. Add a QR code if you need one.",
  },
  {
    number: "03",
    title: "Watch the clicks roll in",
    description:
      "Open analytics to see countries, cities, devices, and referrers in real time.",
  },
] as const

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    badge: "Free forever",
    price: 0,
    period: "forever",
    description: "Try everything Xaply offers. No credit card, no trial timer.",
    features: [
      "50 active links max",
      "5,000 link visits per month",
      "7-day click history",
      "Custom slugs on go.xaply.in",
      "QR codes",
      "Password & expiry controls",
    ],
    cta: "Create free account",
    href: "/sign-up",
    highlighted: false,
    comingSoon: false,
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most popular",
    price: 12,
    period: "month",
    description:
      "More links, higher visit limits, and a longer analytics window.",
    features: [
      "Everything in Free",
      "500 active links",
      "50,000 link visits per month",
      "1-year click history in dashboard",
      "Priority email support",
    ],
    cta: "Get Pro",
    href: "/sign-up?plan=pro",
    highlighted: true,
    comingSoon: false,
  },
  {
    id: "business",
    name: "Business",
    badge: "Coming soon",
    price: 39,
    period: "month",
    description: "Team seats, webhooks, and deeper analytics. Shipping soon.",
    features: [
      "Unlimited links",
      "View click history up to 3 years back",
      "Team seats & workspaces",
      "Webhooks",
      "Priority support",
    ],
    cta: "Coming soon",
    href: "/sign-up",
    highlighted: false,
    comingSoon: true,
  },
] as const

export type PricingPlanId = (typeof PRICING_PLANS)[number]["id"]

/** @deprecated Use PRICING_PLANS[0].features */
export const FREE_TIER = PRICING_PLANS[0].features

export const FAQ = [
  {
    q: "Is Xaply free?",
    a: "Yes. The free plan includes up to 50 active links, 5,000 tracked clicks per month, 7-day click history, custom slugs, QR codes, password protection, and expiry controls. No credit card required.",
  },
  {
    q: "What counts as a tracked click?",
    a: "Each time someone opens one of your short links, that counts as 1 visit toward your monthly limit (all links combined). On Free, links stop redirecting after 5,000 visits in a month. We email you when you hit the limit. Upgrade to Pro for a higher allowance, or wait until next month when the counter resets.",
  },
  {
    q: "Do you track referrers?",
    a: "Yes. Every tracked click stores where the visitor came from (e.g. twitter.com, google.com) when the browser sends a Referer header. You can see referrer breakdowns on each link's analytics page. Direct visits with no referrer show as Direct.",
  },
  {
    q: "What does click history mean?",
    a: "It is how far back you can view clicks in your dashboard: charts, countries, devices, and referrers. Free shows the last 7 days. Pro will show up to 1 year. We store every click; the plan just controls how much history you can browse.",
  },
  {
    q: "How does billing work?",
    a: "Free accounts never need a card. Pro is billed securely through Dodo Payments. Business is coming soon. You can upgrade, downgrade, or cancel anytime from your dashboard.",
  },
  {
    q: "What does runs on Cloudflare Edge mean?",
    a: "Xaply is built on Cloudflare Workers and KV for redirects. That is the infrastructure we use, not a sponsorship. Your links resolve close to visitors worldwide for low latency.",
  },
  {
    q: "Can I use my own domain?",
    a: "Not yet. All links currently use go.xaply.in. Custom domains (e.g. links.yourbrand.com) are on our roadmap. The backend already supports per-domain links, but DNS setup and SSL are not live yet.",
  },
  {
    q: "Who is Xaply for?",
    a: "Creators, marketers, founders, and developers who want fast short links with honest analytics and no bloat.",
  },
] as const
