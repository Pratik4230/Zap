# ⚡ Zap — URL Shortener

> A modern, fast, open-source URL shortener built 100% on Cloudflare's edge infrastructure.
> Sub-10ms redirects globally. Smart deep links. Full analytics. Self-hostable.

---

## 📌 Project Overview

**Zap** is a URL shortening platform that goes beyond simple redirects. It provides:
- Lightning-fast global redirects via Cloudflare's edge network
- Smart device-aware links (opens app first, falls back to web)
- Real-time analytics (clicks, countries, devices, referrers)
- Full auth system (email + Google + GitHub)
- QR code generation for every link
- Future: Expo mobile app for managing links on the go

**Why build this?**
- Learn the entire Cloudflare ecosystem hands-on
- Most URL shorteners are overpriced (Bitly $35/mo) or missing key features
- 100% free to run at MVP scale using Cloudflare's free tiers

---

## 🏗️ Tech Stack

### Core Philosophy
> Everything runs on Cloudflare. No Vercel, no AWS, no external databases.
> This keeps costs at $0 for MVP and teaches the full CF platform.

### Stack Decisions

| Layer | Technology | Why This Choice |
|---|---|---|
| **Monorepo** | pnpm Workspaces + Turborepo | Share types across web/workers/future Expo app |
| **Frontend** | Next.js 15 (App Router) | SSR needed for SEO (landing, pricing, blog pages) |
| **CF Adapter** | @opennextjs/cloudflare | Runs Next.js natively on Cloudflare Pages |
| **Backend API** | Next.js API Routes + Server Actions | Same app as frontend — no separate API server needed |
| **Redirect Engine** | Raw Cloudflare Worker (no framework) | 60 lines of TS, too simple to need Hono or any framework |
| **Analytics Worker** | Raw Cloudflare Worker (no framework) | Simple Queue consumer — reads events, writes to D1 |
| **Database** | Cloudflare D1 (SQLite) | Free 5GB, global read replicas, edge-native |
| **Cache** | Cloudflare KV | Sits in front of D1, slug→URL lookups in < 1ms |
| **File Storage** | Cloudflare R2 | QR code images, OG images. No egress fees. |
| **Background Jobs** | Cloudflare Queues | Async click event processing (non-blocking redirects) |
| **Cron Jobs** | Worker Cron Triggers | Clean up expired links daily |
| **ORM** | Drizzle ORM | Type-safe, works with D1, edge-compatible |
| **Auth** | Better Auth | Self-hosted, no Clerk. Runs on Next.js + D1 |
| **Email** | Resend | Password reset, email verification. Free: 3K/mo |
| **Styling** | Tailwind CSS v4 | Utility-first, works great with Next.js |
| **UI Components** | shadcn/ui | Accessible, customizable, no vendor lock-in |
| **Deployment** | Cloudflare Pages (web) + Wrangler (workers) | One command deploys globally |

### What We're NOT Using (and Why)

| Rejected | Why Not |
|---|---|
| Vercel | Want 100% Cloudflare to learn the platform |
| Clerk | External service, costs money, prefer self-hosted |
| Prisma | Not edge-compatible, Drizzle is faster for D1 |
| Postgres/Neon | D1 is free + edge-native, fine for URL shortener |
| React + Vite (SPA) | No SSR = bad SEO for landing/pricing pages |
| Hono | Overkill for redirect worker (60 lines); Next.js handles the API |
| tRPC | Not needed — frontend and API are in the same Next.js app (Server Actions) |
| Turborepo alone | Still needs pnpm Workspaces underneath |
| Separate Hono API Worker | Next.js API Routes do the same job, with auth + type safety built in |

---

## 🌐 Architecture

### How the System Works

```
                    ┌────────────────────────────────┐
                    │        ZAP ECOSYSTEM           │
                    └────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  USER CLICKS SHORT LINK: go.zap.dev/abc123                      │
│                                                                 │
│  Cloudflare Worker (redirect-worker)                            │
│  Runs in nearest city globally (< 10ms)                        │
│                                                                 │
│  Step 1: Check KV cache (slug → URL)   → hit  → redirect ⚡    │
│  Step 2: Cache miss → query D1 replica → found → redirect + cache│
│  Step 3: Detect device (iOS/Android/Desktop)                    │
│  Step 4: Smart redirect:                                        │
│           iOS     → tries Universal Link (opens app)            │
│           Android → tries App Link (opens app)                  │
│           Desktop → direct web URL                              │
│  Step 5: Log click to Cloudflare Queue (async, non-blocking)   │
│                                                                 │
│  ┌──────────────┐    ┌──────────┐    ┌──────────┐             │
│  │ Cloudflare   │    │    KV    │    │    D1    │             │
│  │   Worker     │───▶│  Cache   │───▶│ Database │             │
│  │ (redirect)   │    │          │    │(replicas)│             │
│  └──────────────┘    └──────────┘    └──────────┘             │
│          │                                                      │
│          └──── Queue ────▶ Analytics Worker ────▶ D1 (stats)  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  USER VISITS DASHBOARD: zap.pages.dev                          │
│                                                                 │
│  Next.js 15 on Cloudflare Pages                                │
│                                                                 │
│  Public Pages (SSR + SEO):    Protected Pages (auth required): │
│  /             Landing        /dashboard      Link list        │
│  /pricing      Pricing        /links/new      Create link      │
│  /blog         Blog           /analytics      Stats charts     │
│  /login        Login          /settings       Account settings │
│  /signup       Signup                                          │
│  /forgot-pass  Reset flow                                      │
│                                                                 │
│  API Routes (Next.js):                                         │
│  /api/auth/[...all]   ← Better Auth (ALL auth endpoints)       │
│  /api/links           ← CRUD for links                         │
│  /api/analytics       ← fetch stats                            │
│  /api/qr              ← generate QR code                       │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐ │
│  │ Next.js  │    │  Better  │    │    D1    │    │   R2    │ │
│  │   App    │───▶│   Auth   │───▶│ Database │    │ Storage │ │
│  │ (Pages)  │    │          │    │(primary) │    │(QR imgs)│ │
│  └──────────┘    └──────────┘    └──────────┘    └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### D1 Global Read/Write Behaviour
```
WRITES (create link, update):
  User anywhere → D1 Primary (one region) → ~200ms for distant users
  Mitigation: Show loading animation while creating (UX handles this gracefully)

READS (redirect lookup):
  User anywhere → KV cache → < 1ms (99% of traffic)
  Cache miss    → D1 nearest replica → ~10ms

Analytics writes:
  Non-blocking → Cloudflare Queue → processed async → user never waits
```

---

## 🚀 Features

### Phase 1 — MVP (Build First)

#### Core Link Management
- [ ] Create short link (random slug OR custom alias)
- [ ] Custom slug validation (length, charset, reserved words)
- [ ] List all links in dashboard
- [ ] Copy short link to clipboard
- [ ] Delete a link
- [ ] Edit destination URL
- [ ] Link expiry (by date OR by click count)
- [ ] Password-protected links
- [ ] Link status (active / paused / expired)

#### Analytics (Basic)
- [ ] Total click count per link
- [ ] Click count over time (last 7d, 30d, 90d)
- [ ] Top countries
- [ ] Top referrers
- [ ] Device breakdown (mobile / desktop / tablet)
- [ ] OS breakdown (iOS / Android / Windows / Mac)
- [ ] Browser breakdown

#### Auth (Full)
- [ ] Email + password signup
- [ ] Email verification (Resend)
- [ ] Login with Google OAuth
- [ ] Login with GitHub OAuth
- [ ] Forgot password → email with reset link
- [ ] Reset password (via token)
- [ ] Change password (authenticated)
- [ ] Account linking (Google/GitHub ↔ email same account)
- [ ] Session management (remember me)
- [ ] Logout / logout all devices

#### QR Codes
- [ ] Auto-generate QR code for every link
- [ ] Download QR as PNG
- [ ] QR code stored in R2

#### Redirect Engine
- [ ] Sub-10ms redirects via Cloudflare Workers
- [ ] KV cache layer (slug → URL)
- [ ] 301 vs 302 redirect option
- [ ] Expired link handling (custom 404 page)
- [ ] Password-protected redirect (prompt page)

### Phase 2 — Power Features

#### Smart Links (Major Differentiator)
- [ ] iOS Universal Links support (open app if installed)
- [ ] Android App Links support
- [ ] App Store / Play Store fallback URLs
- [ ] Deferred deep linking (carry intent through install)
- [ ] Desktop-only / Mobile-only links
- [ ] Geo-targeted redirects (different URL per country)

#### Link Organization
- [ ] Tags for links
- [ ] Folders / collections
- [ ] Search and filter links
- [ ] Bulk operations (delete, pause, tag)
- [ ] CSV import / export

#### Advanced Analytics
- [ ] Real-time click stream
- [ ] City-level geo data
- [ ] UTM parameter tracking
- [ ] Referrer deep-dive
- [ ] Public stats page (shareable)
- [ ] Export analytics as CSV

#### QR Codes (Enhanced)
- [ ] Custom QR colors
- [ ] Add logo to QR code
- [ ] Dynamic QR codes (update destination without reprinting)

### Phase 3 — Growth

#### Teams & Workspaces
- [ ] Multiple workspaces per user
- [ ] Invite team members
- [ ] Role-based access (owner / editor / viewer)
- [ ] Audit log

#### Link-in-Bio
- [ ] Create a bio page (`zap.dev/@username`)
- [ ] Add multiple links to bio page
- [ ] Custom themes
- [ ] Analytics per bio link

#### Developer Experience
- [ ] Public REST API
- [ ] API key management
- [ ] Webhooks (on click, on link create)
- [ ] OpenAPI spec / Swagger docs

#### Mobile App (Expo)
- [ ] Create short links from phone
- [ ] View analytics
- [ ] Share extension (shorten from any app)

---

## 📁 Project Structure

```
zap/                                 ← monorepo root
├── turbo.json                       ← Turborepo pipeline config
├── pnpm-workspace.yaml              ← defines workspace packages
├── package.json                     ← root scripts
├── .env.example                     ← all env vars documented
├── README.md                        ← this file
│
├── packages/
│   ├── shared/                      ← shared across ALL apps
│   │   ├── src/
│   │   │   ├── types.ts             ← Link, User, Click, Workspace TS types
│   │   │   ├── schema.ts            ← Drizzle ORM schema (single source of truth)
│   │   │   ├── auth.ts              ← Better Auth config (shared instance)
│   │   │   └── utils.ts             ← slug generation, base62 encoder, etc.
│   │   └── package.json
│   │
│   └── ui/                          ← shared React components
│       ├── src/
│       │   ├── button.tsx
│       │   ├── card.tsx
│       │   └── index.ts
│       └── package.json
│
└── apps/
    ├── web/                         ← Next.js 15 (Cloudflare Pages)
    │   ├── app/
    │   │   ├── layout.tsx           ← root layout (fonts, providers)
    │   │   ├── page.tsx             ← / Landing page (SSR + SEO)
    │   │   ├── pricing/
    │   │   ├── blog/
    │   │   ├── (auth)/              ← route group (no shared layout)
    │   │   │   ├── login/
    │   │   │   ├── signup/
    │   │   │   ├── forgot-password/
    │   │   │   └── reset-password/
    │   │   ├── (dashboard)/         ← protected route group
    │   │   │   ├── layout.tsx       ← dashboard layout (sidebar, nav)
    │   │   │   ├── dashboard/       ← overview stats
    │   │   │   ├── links/           ← link list + create
    │   │   │   ├── analytics/       ← analytics charts
    │   │   │   └── settings/        ← account settings, change password
    │   │   └── api/
    │   │       ├── auth/
    │   │       │   └── [...all]/
    │   │       │       └── route.ts ← Better Auth catch-all handler
    │   │       ├── links/
    │   │       │   └── route.ts     ← GET (list), POST (create)
    │   │       ├── links/[id]/
    │   │       │   └── route.ts     ← GET, PATCH, DELETE
    │   │       ├── analytics/
    │   │       │   └── route.ts     ← GET stats
    │   │       └── qr/
    │   │           └── route.ts     ← POST generate QR, upload to R2
    │   ├── components/              ← page-level components
    │   ├── lib/
    │   │   ├── db.ts                ← Drizzle + D1 client (edge-compatible)
    │   │   └── session.ts           ← Better Auth session helpers
    │   ├── middleware.ts            ← auth protection for /dashboard routes
    │   ├── open-next.config.ts      ← @opennextjs/cloudflare config
    │   ├── wrangler.toml            ← D1, KV, R2, Queue bindings for Pages
    │   ├── next.config.ts
    │   └── package.json
    │
    ├── redirect-worker/             ← Cloudflare Worker (Hono)
    │   ├── src/
    │   │   ├── index.ts             ← Worker entry, request routing
    │   │   ├── redirect.ts          ← core redirect logic (KV → D1 → redirect)
    │   │   ├── smart-redirect.ts    ← iOS/Android/Desktop detection
    │   │   ├── deep-link.ts         ← HTML interstitial page for app links
    │   │   └── analytics.ts         ← fire click event to Queue
    │   ├── wrangler.toml            ← Worker config + KV, D1, Queue bindings
    │   └── package.json
    │
    ├── analytics-worker/            ← Cloudflare Queue Consumer Worker
    │   ├── src/
    │   │   └── index.ts             ← reads Queue, writes click rows to D1
    │   ├── wrangler.toml
    │   └── package.json
    │
    └── mobile/                      ← Expo app (Phase 3, placeholder for now)
        └── package.json
```

---

## 🗄️ Database Schema (D1 / SQLite)

```sql
-- Users (managed by Better Auth, auto-created)
users
  id TEXT PRIMARY KEY
  name TEXT
  email TEXT UNIQUE
  email_verified INTEGER (0/1)
  image TEXT
  created_at INTEGER
  updated_at INTEGER

-- Sessions (managed by Better Auth)
sessions
  id TEXT PRIMARY KEY
  user_id TEXT → users.id
  expires_at INTEGER
  token TEXT UNIQUE

-- Accounts (OAuth providers, managed by Better Auth)
accounts
  id TEXT PRIMARY KEY
  user_id TEXT → users.id
  provider TEXT          -- "google", "github", "credential"
  provider_account_id TEXT

-- Verification tokens (email verify, password reset — Better Auth)
verifications
  id TEXT PRIMARY KEY
  identifier TEXT
  value TEXT
  expires_at INTEGER

-- Workspaces (future multi-tenant support)
workspaces
  id TEXT PRIMARY KEY
  name TEXT
  slug TEXT UNIQUE        -- used in URLs
  owner_id TEXT → users.id
  plan TEXT DEFAULT 'free'
  created_at INTEGER

-- Links (core table)
links
  id TEXT PRIMARY KEY
  workspace_id TEXT → workspaces.id
  user_id TEXT → users.id
  slug TEXT               -- the short code (e.g. "abc123")
  domain TEXT             -- "go.zap.dev" or custom domain
  destination_url TEXT    -- where it redirects to
  title TEXT              -- optional label
  password_hash TEXT      -- null if not password-protected
  expires_at INTEGER      -- null if no expiry
  click_limit INTEGER     -- null if no limit
  click_count INTEGER DEFAULT 0
  status TEXT DEFAULT 'active'  -- active | paused | expired
  -- Smart link fields (Phase 2)
  ios_url TEXT            -- Universal Link / custom scheme
  ios_store_url TEXT      -- App Store fallback
  android_url TEXT
  android_store_url TEXT
  -- Metadata
  created_at INTEGER
  updated_at INTEGER

-- Click events (analytics)
clicks
  id TEXT PRIMARY KEY
  link_id TEXT → links.id
  timestamp INTEGER
  country TEXT            -- ISO 3166-1 alpha-2 (from CF-IPCountry header)
  city TEXT
  device TEXT             -- mobile | desktop | tablet
  os TEXT                 -- iOS | Android | Windows | macOS | Linux
  browser TEXT
  referrer TEXT
  -- Note: IP is never stored (privacy)
```

---

## 🔐 Auth Flow (Better Auth)

```
Email Signup:
  POST /api/auth/sign-up/email
  → creates user in D1
  → sends verification email (Resend)
  → user clicks link → email verified
  → redirect to dashboard

Email Login:
  POST /api/auth/sign-in/email
  → checks credentials in D1
  → creates session in D1
  → sets session cookie

Google/GitHub OAuth:
  GET /api/auth/sign-in/google (or /github)
  → redirects to Google/GitHub
  → callback: GET /api/auth/callback/google
  → creates/links user in D1
  → creates session

Forgot Password:
  POST /api/auth/forget-password  { email }
  → generates reset token
  → sends email with reset link (Resend)

Reset Password:
  POST /api/auth/reset-password   { token, newPassword }
  → validates token
  → updates password hash in D1

Change Password (authenticated):
  POST /api/auth/change-password  { currentPassword, newPassword }
  → validates current password
  → updates hash in D1

All handled by Better Auth — one catch-all route does everything:
  app/api/auth/[...all]/route.ts
```

---

## 🌍 URLs (Development vs Production)

### Development (local)
```
localhost:3000          Next.js dashboard
localhost:8787          Redirect Worker (wrangler dev)
localhost:8788          Analytics Worker
```

### Staging (Cloudflare free subdomains)
```
zap.pages.dev                         Dashboard (Cloudflare Pages)
zap-redirect.<account>.workers.dev    Redirect Worker
```

### Production (when domain is purchased)
```
zap.dev (or chosen domain)
  /                 Landing page
  /dashboard        App
app.zap.dev         Same Next.js app (alt subdomain)
go.zap.dev          Redirect Worker (short links)
```

> ⚠️ Google/GitHub OAuth: Use `localhost:3000` during local dev.
> Cloudflare Pages `*.pages.dev` domain works fine for staging OAuth testing.
> Real domain required for production OAuth + sending emails from a real address.

---

## 🔑 Environment Variables

```bash
# Cloudflare (auto-injected via wrangler bindings, not .env)
# DB          = D1 binding
# KV          = KV namespace binding
# R2          = R2 bucket binding
# QUEUE       = Queue binding

# Better Auth
BETTER_AUTH_SECRET=           # random 32+ char secret (openssl rand -base64 32)
BETTER_AUTH_URL=              # base URL of your app (http://localhost:3000 in dev)

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email (Resend)
RESEND_API_KEY=               # get from resend.com (free: 3K emails/month)
EMAIL_FROM=                   # e.g. "Zap <noreply@yourdomain.com>"
```

---

## 🛠️ Development Setup (Once Project is Scaffolded)

```bash
# Prerequisites
node >= 20
pnpm >= 9

# Install dependencies
pnpm install

# Authenticate with Cloudflare
npx wrangler login

# Create D1 database
npx wrangler d1 create zap-db

# Create KV namespace
npx wrangler kv namespace create ZAP_CACHE

# Create R2 bucket
npx wrangler r2 bucket create zap-files

# Create Queue
npx wrangler queues create zap-analytics

# Run DB migrations
npx wrangler d1 migrations apply zap-db --local

# Copy env file
cp .env.example .env.local
# Fill in BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID etc.

# Start everything
pnpm dev
# └─ Next.js on localhost:3000
# └─ Redirect Worker on localhost:8787
# └─ Analytics Worker on localhost:8788
```

---

## ✅ TODO

### Setup & Scaffolding
- [ ] Init monorepo (pnpm workspaces + Turborepo)
- [ ] Create `packages/shared` (types, schema, auth config)
- [ ] Create `packages/ui` (empty, placeholder)
- [ ] Create `apps/web` (Next.js 15 + @opennextjs/cloudflare)
- [ ] Create `apps/redirect-worker` (Wrangler + Hono)
- [ ] Create `apps/analytics-worker` (Wrangler + Queue consumer)
- [ ] Create `apps/mobile` (empty Expo placeholder)
- [ ] Set up Turborepo pipelines (dev, build, deploy)
- [ ] Configure `wrangler.toml` for all workers
- [ ] Set up D1 migrations structure

### Database
- [ ] Write Drizzle schema (all tables above)
- [ ] Generate Better Auth tables migration
- [ ] Create migration runner script
- [ ] Seed script for local dev (test user, sample links)

### Auth
- [ ] Configure Better Auth in `packages/shared/auth.ts`
- [ ] Add Better Auth catch-all route in Next.js
- [ ] Build login page UI
- [ ] Build signup page UI
- [ ] Build forgot password page UI
- [ ] Build reset password page UI
- [ ] Build change password UI (in settings)
- [ ] Add Google OAuth credentials (Google Console)
- [ ] Add GitHub OAuth credentials (GitHub Developer Settings)
- [ ] Configure Resend for transactional emails
- [ ] Add auth middleware (protect `/dashboard` routes)

### Redirect Worker
- [ ] Basic slug lookup (KV → D1 → redirect)
- [ ] Handle link not found (404 page)
- [ ] Handle expired links
- [ ] Handle password-protected links (prompt page)
- [ ] Device detection (iOS / Android / Desktop)
- [ ] Fire click event to Queue (async)
- [ ] Cache management (KV invalidation on link update/delete)

### Analytics Worker
- [ ] Queue consumer setup
- [ ] Parse click events from Queue
- [ ] Write to D1 clicks table
- [ ] Increment click_count on links table

### Dashboard
- [ ] Dashboard overview (total links, total clicks, recent activity)
- [ ] Links list page (table, search, filter)
- [ ] Create link form (with loading animation ← D1 write delay UX)
- [ ] Link detail / edit page
- [ ] Delete link (with confirmation)
- [ ] Copy short URL button
- [ ] Analytics page (charts: clicks over time, geo, device)
- [ ] Settings page (change password, account info, delete account)

### QR Codes
- [ ] Generate QR on link creation
- [ ] Upload QR PNG to R2
- [ ] Display QR in link detail
- [ ] Download QR button

### Landing Page (SEO)
- [ ] Hero section (with live demo shortener)
- [ ] Features section
- [ ] Pricing section (free tier highlighted)
- [ ] FAQ section
- [ ] Proper meta tags, OG image, sitemap.xml
- [ ] robots.txt

### Infrastructure
- [ ] Deploy Next.js to Cloudflare Pages
- [ ] Deploy Redirect Worker
- [ ] Deploy Analytics Worker
- [ ] Set up Cron Trigger (daily expired link cleanup)

---

## 📋 Key Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06-09 | 100% Cloudflare stack | Learn CF platform fully, free tier covers MVP |
| 2026-06-09 | Cloudflare D1 for DB | Free 5GB, global read replicas, edge-native SQLite |
| 2026-06-09 | KV cache in front of D1 | Redirects must be < 10ms, KV serves from nearest PoP |
| 2026-06-09 | Cloudflare Queues for analytics | Click logging must be async, cannot block the redirect |
| 2026-06-09 | Better Auth (not Clerk) | Self-hosted, free, works with D1, full-featured |
| 2026-06-09 | Next.js 15 (not React SPA) | SEO required for landing/pricing/blog pages |
| 2026-06-09 | @opennextjs/cloudflare adapter | Official way to run Next.js on Cloudflare Pages |
| 2026-06-09 | Separate redirect Worker | Redirect needs edge runtime, Next.js adds overhead |
| 2026-06-09 | pnpm + Turborepo monorepo | Future Expo app shares types; Turborepo parallelizes builds |
| 2026-06-09 | Resend for email | Free 3K emails/month, best DX, works everywhere |
| 2026-06-10 | D1 write animation (UX) | D1 primary write ~200ms; show creation animation instead of optimistic UI |
| 2026-06-10 | No Postgres/Neon | D1 is sufficient; URL shortener is read-heavy (KV handles it) |
| 2026-06-10 | workers.dev / pages.dev for now | No domain yet; OAuth works on localhost for dev |

---

## 📦 Key Dependencies

```json
// packages/shared
{
  "better-auth": "latest",
  "drizzle-orm": "latest",
  "hono": "latest",
  "resend": "latest",
  "zod": "latest"
}

// apps/web
{
  "next": "15.x",
  "@opennextjs/cloudflare": "latest",
  "drizzle-orm": "latest",
  "tailwindcss": "4.x"
}

// apps/redirect-worker + analytics-worker
{
  "hono": "latest",
  "wrangler": "latest"
}
```

---

## 🔮 Future Roadmap

- **Custom domains** — let users bring their own domain for short links
- **A/B split testing** — route traffic to multiple destinations by %
- **Retargeting pixels** — embed Meta/Google pixel in every link
- **Link-in-bio pages** — drag-and-drop bio page builder
- **REST API + webhooks** — for developers to integrate
- **Expo mobile app** — create/manage links from phone
- **Team workspaces** — multi-user, RBAC
- **SSO / SAML** — enterprise auth
- **Self-hosted Docker** — one-click self-host for privacy-conscious orgs
