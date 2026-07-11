# ⚡ Xaply — URL Shortener

> **Open-source, production-grade URL shortener built entirely on Cloudflare's edge infrastructure.**  
> Turn long URLs into short links, share them anywhere, and see who clicked them — in real time.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Infrastructure](#infrastructure)
5. [Database Schema](#database-schema)
6. [Security Model](#security-model)
7. [API Reference](#api-reference)
8. [Data Flow](#data-flow)
9. [Resume Bullet Points](#resume-bullet-points)

---

## Product Overview

Xaply is a full-stack URL shortening platform with two public-facing surfaces:

| Surface | Domain | Purpose |
|---------|--------|---------|
| Dashboard | `xaply.in` | Auth, link management, analytics |
| Redirect Engine | `go.xaply.in` | Fast edge redirects |

Users sign up, create short links with optional slugs, and get rich click analytics — countries, cities, devices, browsers, referrers — all without any third-party analytics vendor.

---

## Features

### 🔗 Link Management
- **Custom or random slugs** — choose your own slug or get a 7-character nanoid
- **Edit destination** — update where a link points without changing the short URL
- **Pause / Resume** — disable a link without deleting it
- **Expiry by date** — link auto-expires at a set datetime
- **Max click limit** — link self-expires after N clicks
- **Password protection** — visitors must enter a password to proceed
- **QR codes** — generated entirely in-browser, nothing stored server-side
- **Per-link titles** — label links for easy identification

### 📊 Analytics
- **Global dashboard** — clicks over the last 7 days (bar chart), top links, countries, cities, device breakdown
- **Per-link analytics** — referrer sources, browsers, OS, device type breakdown
- **Geo data** — country + city extracted from Cloudflare's native `cf-ipcountry` / city headers (no MaxMind license needed)
- **Device detection** — mobile / desktop / tablet parsed from User-Agent
- **Infinite scroll** — handles large link lists without pagination UI

### 🔒 Auth & Security
- **Email + password** with mandatory email verification via OTP
- **Google** and **GitHub** OAuth
- **Rate limiting** on every API endpoint, redirect worker, and auth routes
- **Session-protected dashboard** — middleware-level route guard
- **Password-protected link cookies** — HMAC-SHA256 signed unlock cookies, no re-entry needed on same browser

### ⚡ Redirect Engine
- **Sub-10ms redirects** via Cloudflare KV edge cache
- **Non-blocking analytics** — click events sent to a queue, zero impact on redirect latency
- **Daily expiry cron** — auto-marks expired-by-date links
- **Password prompt page** — fully server-rendered, no JS required on visitor side
- **Click limit enforcement** — atomic check + expire on click limit breach

---

## Architecture

Xaply is a **pnpm monorepo** orchestrated by **Turborepo**, consisting of three apps and four shared packages.

```
zap/
├── apps/
│   ├── web/               ← Next.js 15 dashboard (UI + REST API)
│   ├── redirect-worker/   ← Cloudflare Worker (go.xaply.in)
│   └── analytics-worker/  ← Cloudflare Worker + Queue consumer
│
└── packages/
    ├── db/                ← Drizzle ORM schema, validators, shared utilities
    ├── ui/                ← shadcn/ui component library
    ├── eslint-config/     ← Shared ESLint rules
    └── typescript-config/ ← Shared tsconfig presets
```

### App Responsibilities

#### `apps/web` — Next.js Dashboard
- Deployed on **Cloudflare Pages** using the `@opennextjs/cloudflare` adapter
- Serves the React dashboard (RSC + Client Components)
- Hosts all REST API routes (`/api/*`)
- Runs **Better Auth** server-side for session management and OAuth flows
- Reads Cloudflare bindings (`D1`, `KV`, `Queue`) directly via `getCloudflareContext()`

#### `apps/redirect-worker` — Edge Redirect Engine
- Pure **Cloudflare Worker** (no Node.js, no framework overhead)
- Handles `fetch` (HTTP requests) and `scheduled` (daily cron) exports
- KV-first lookup for hot paths, D1 fallback for cache misses
- Renders a server-side HTML password page (no client-side JS dependency)

#### `apps/analytics-worker` — Async Click Processor
- **Cloudflare Worker** acting as a **Queue consumer**
- Processes batches of `ClickEvent` messages
- Writes to D1 atomically using Drizzle's `db.batch([...])` API
- Auto-retries failed messages; acknowledges successful ones

#### `packages/db` — Shared Database Layer
- Single source of truth for schema, types, and domain logic
- Used by all three apps — enforces consistency across the monorepo
- Exports: schema, validators, password utilities, rate limit helpers, public link mappers

---

## Infrastructure

All infrastructure runs on **Cloudflare's developer platform** — no servers, no containers, no VMs.

| Component | Technology | Details |
|-----------|-----------|---------|
| Web App | Cloudflare Pages + OpenNext | Next.js 15 at the edge |
| Redirect Worker | Cloudflare Worker | V8 isolates, global PoP |
| Analytics Worker | Cloudflare Worker | Queue consumer |
| Database | Cloudflare D1 (SQLite) | Single `zap-db` shared by all apps |
| Cache | Cloudflare KV | Slug → link cache (7-day TTL), rate limit counters |
| Queue | Cloudflare Queue | Async click ingestion, decoupled from redirects |
| Email | Resend | Transactional OTP + verification emails |
| Auth | Better Auth | Sessions, OAuth, email OTP plugin |
| ORM | Drizzle ORM | Type-safe SQLite queries, D1 compatible |
| Monorepo | pnpm + Turborepo | Parallel builds, shared packages |

### Why Cloudflare-Only?

- **Zero cold starts** — Cloudflare Workers use V8 isolates, not containers
- **Global edge** — redirects happen at the PoP closest to the visitor
- **Unified billing** — one platform for compute, DB, cache, and queues
- **No egress fees** — D1 and KV reads are intra-Cloudflare
- **Built-in geo** — `cf-ipcountry`, `cf-ipcity` headers from Cloudflare, no third-party geo IP service needed

---

## Database Schema

One **D1 (SQLite) database** shared across all three apps. Managed with **Drizzle ORM**.

```
┌─────────────┐       ┌─────────────┐       ┌──────────────┐
│    user     │──────▶│   account   │       │  verification│
│─────────────│       │─────────────│       │──────────────│
│ id (PK)     │       │ userId (FK) │       │ identifier   │
│ name        │       │ providerId  │       │ value (OTP)  │
│ email       │       │ accessToken │       │ expiresAt    │
│ emailVerif. │       └─────────────┘       └──────────────┘
│ image       │
└──────┬──────┘
       │
       ▼
┌─────────────┐       ┌─────────────────────────────────────┐
│  workspace  │       │               links                  │
│─────────────│──────▶│──────────────────────────────────────│
│ id (PK)     │       │ id (PK)                              │
│ name        │       │ userId (FK)  workspaceId (FK)        │
│ slug        │       │ slug         domain                  │
│ ownerId(FK) │       │ destinationUrl                       │
│ plan free/pro│      │ title        passwordHash            │
└─────────────┘       │ expiresAt    clickLimit  clickCount  │
                      │ status: active | paused | expired    │
                      │ iosUrl  androidUrl (deep links)      │
                      └──────────────────┬──────────────────┘
                                         │
                                         ▼
                              ┌──────────────────┐
                              │      clicks       │
                              │──────────────────│
                              │ id (PK)           │
                              │ linkId (FK)       │
                              │ timestamp         │
                              │ country  city     │
                              │ device   os       │
                              │ browser  referrer │
                              └──────────────────┘
```

### Indexes
```sql
-- Unique slug per domain (prevents duplicate short URLs)
CREATE UNIQUE INDEX links_slug_domain_idx ON links(slug, domain);

-- Fast user link listing
CREATE INDEX links_user_id_idx ON links(user_id);

-- Fast analytics queries
CREATE INDEX clicks_link_id_idx ON clicks(link_id);
CREATE INDEX clicks_timestamp_idx ON clicks(timestamp);
```

---

## Security Model

### Authentication
- Better Auth manages session cookies (7-day expiry, auto-refresh)
- Email verification enforced before first login
- OAuth accounts linked to existing email accounts

### Route Protection
- **Middleware-level**: `middleware.ts` calls `/api/auth/get-session` before serving any protected route
- **API-level**: `requireSession()` helper validates session on every API handler

### Rate Limiting

All rate limits are backed by **Cloudflare KV** using a sliding window algorithm:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Link create | 100 req | 60s per user |
| Link mutate (edit/delete) | 60 req | 60s per user |
| Link read / list | 120 req | 60s per user |
| Auth endpoints | 100 req | 60s per IP |
| Redirect (go.xaply.in) | Configurable | per IP |
| Password guess | Configurable | per IP + slug |

### Password-Protected Links
1. `passwordHash` stored as **bcrypt** hash in D1
2. Visitor submits password via HTML form (POST)
3. Worker verifies against bcrypt hash
4. On success: sets **HMAC-SHA256 signed cookie** (`link_unlocked_<id>`)
5. Subsequent visits: cookie verified server-side — no re-entry needed
6. Cookie brute-force: separate KV rate limit per `IP:slug`

### Input Validation
Every link field is validated through `packages/db/src/validation.ts`:
- URL sanitization + safe redirect assertion
- Slug: alphanumeric + hyphens, length bounded
- Password: min/max length
- Expiry: must be future datetime
- Click limit: positive integer

---

## API Reference

### Links

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/links` | ✅ | List links — supports `q`, `status`, `sort`, `page`, `limit` |
| `POST` | `/api/links` | ✅ | Create short link |
| `PATCH` | `/api/links/[id]` | ✅ | Update link fields or toggle status |
| `DELETE` | `/api/links/[id]` | ✅ | Delete link + evict KV cache |
| `GET` | `/api/links/summary` | ✅ | Stats: totalLinks, totalClicks, activeLinks, activeRate |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analytics` | ✅ | Global: 7-day clicks, top links, countries, cities, devices |
| `GET` | `/api/analytics/[id]` | ✅ | Per-link: referrers, browsers, OS, device breakdown |

### Auth (Better Auth managed)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/sign-in/email` | Email + password login |
| `POST` | `/api/auth/sign-up/email` | Registration |
| `GET` | `/api/auth/callback/google` | Google OAuth callback |
| `GET` | `/api/auth/callback/github` | GitHub OAuth callback |
| `POST` | `/api/auth/email-otp/send-otp` | Send OTP email |
| `POST` | `/api/auth/email-otp/verify-otp` | Verify OTP |
| `GET` | `/api/auth/get-session` | Current session |
| `POST` | `/api/auth/sign-out` | Sign out |

### Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `PATCH` | `/api/profile` | ✅ | Update display name |

---

## Data Flow

### Redirect Flow (go.xaply.in)

```
Visitor ──▶ go.xaply.in/abc
              │
              ├── 1. Validate slug format
              ├── 2. Rate limit check (KV: IP bucket)
              ├── 3. KV cache lookup
              │     └── Miss: D1 query → write back to KV (TTL 7d)
              ├── 4. Link status check
              │     ├── paused/expired → 410 Gone
              │     └── click limit hit → mark expired (async) → 410 Gone
              ├── 5. Password check
              │     ├── No password → step 6
              │     ├── Has password + valid unlock cookie → step 6
              │     ├── Has password, GET → render HTML password page
              │     └── Has password, POST (form) → bcrypt verify
              │           ├── Wrong → re-render with error
              │           └── Correct → set HMAC cookie → 302 to self
              └── 6. 302 redirect to destinationUrl
                    └── ctx.waitUntil(Queue.send(ClickEvent)) [non-blocking]
```

### Analytics Ingestion Flow

```
Cloudflare Queue (ANALYTICS_QUEUE)
  │
  └── analytics-worker.queue(batch)
        │
        ├── For each ClickEvent:
        │     ├── INSERT clicks (country, city, device, OS, browser, referrer)
        │     ├── UPDATE links SET click_count = click_count + 1
        │     ├── Re-fetch link
        │     │     └── if clickLimit hit: UPDATE links SET status = "expired"
        │     ├── message.ack()    ← success
        │     └── message.retry()  ← on error (auto-redelivered)
        └── Done
```

### Dashboard API Flow

```
Browser ──▶ xaply.in (Next.js on Cloudflare Pages)
              │
              ├── middleware.ts
              │     └── hasValidSession() → /api/auth/get-session (internal fetch)
              │           ├── No session → redirect /sign-in?next=<path>
              │           └── Has session → continue
              │
              └── API Route Handler
                    ├── getCloudflareContext() → env (D1, KV, Queue)
                    ├── requireSession(request, env) → session or 401
                    ├── rateLimit(kv, key, limit, window)
                    ├── Validate input
                    ├── Drizzle query → D1
                    └── Return JSON
```

### Link Creation Flow

```
POST /api/links
  │
  ├── Auth check
  ├── Rate limit (create bucket)
  ├── Parse + validate all fields (URL, slug, title, expiry, clickLimit, password)
  ├── Hash password (bcrypt) if provided
  ├── Generate nanoid(7) if no slug
  ├── INSERT into D1 links table
  ├── KV.put(slug, JSON.stringify(link), { expirationTtl: 604800 }) [cache warmup]
  └── Return 201 { link: publicLink }
```

---

## Resume Bullet Points

> **For a 2+ year experience developer** — ATS-friendly, impact-focused, technically specific.

---

### 🏗️ Architecture & System Design

- Designed and shipped a **multi-app Cloudflare-native monorepo** (pnpm + Turborepo) with a Next.js dashboard, two Cloudflare Workers, and a shared Drizzle ORM package — achieving zero code duplication across services

- Architected a **decoupled click ingestion pipeline** using Cloudflare Queues, reducing redirect P99 latency by eliminating synchronous DB writes from the hot redirect path

- Implemented a **KV-first caching strategy** for the redirect engine — serving cache hits in under 10ms at the edge with 7-day TTL and automatic invalidation on link updates/deletes

- Built a **shared database package** (`packages/db`) across three apps with a single Drizzle ORM schema, centralizing validation, type definitions, and domain logic — eliminating drift between services

- Designed a **multi-tenant-ready schema** with `workspaces` table (free/pro plans, owner references) and full cascade deletes — architected for future team/organization features

### ⚡ Performance

- Achieved **sub-10ms edge redirects** using Cloudflare Worker V8 isolates + KV slug cache, with D1 as a fallback — no cold starts, no containers

- Eliminated analytics write latency from redirect responses using **`ctx.waitUntil` + Cloudflare Queue** — fire-and-forget pattern with guaranteed delivery and automatic retry

- Implemented **debounced server-side search** (370ms) with infinite scroll using TanStack Query `useInfiniteQuery`, reducing unnecessary API calls on the links dashboard

- Warmed up the KV cache immediately on link creation — ensuring the first redirect hit is always a cache hit, avoiding a cold D1 round-trip for new links

### 🔒 Security

- Implemented **layered rate limiting** across three tiers (link create, mutate, read) using a custom **KV sliding-window algorithm** — protecting against API abuse without any external service

- Built a **password-protected link system** with bcrypt hashing + HMAC-SHA256 signed cookies — allowing one-time password entry per browser session with cryptographic verification on each redirect

- Integrated **Better Auth** with email OTP (Resend), Google OAuth, and GitHub OAuth — enforcing email verification before dashboard access and rate-limiting auth endpoints via KV storage

- Enforced per-IP rate limits on the redirect worker and per-IP+slug limits on password guessing — preventing brute-force attacks at the edge with zero DB involvement

### 🛠️ Full-Stack Engineering

- Built end-to-end **link analytics pipeline** — from Cloudflare geo headers (`cf-ipcountry`, `cf-ipcity`) and User-Agent parsing in the redirect worker to D1 storage and aggregated dashboard queries

- Developed a **client-side React dashboard** with TanStack Query mutations, optimistic UI patterns, debounced filtering, and infinite scroll — all without Redux or Zustand

- Shipped a **server-rendered HTML password page** inside a Cloudflare Worker with no client-side JS dependency — pure form handling with rate-limited brute-force protection

- Implemented **cascade delete** at the DB layer ensuring all related sessions, links, and click events are purged atomically when a user deletes their account

- Integrated **nanoid** for 7-character random slug generation with collision detection — returning a `409 Slug already taken` error and prompting the client to retry

### 🧪 DevEx & Tooling

- Configured **Turborepo** for parallel builds with task dependency graphs — running `lint`, `check-types`, and `build` concurrently across all packages

- Standardized **TypeScript** across the entire monorepo with shared `tsconfig` presets, strict mode enabled, and no implicit `any` — catching cross-app contract violations at compile time

- Set up **local D1 development** with Wrangler's local SQLite emulation and seed scripts — full offline development with no cloud credentials required

- Wrote a **migration-first schema workflow**: edit schema → `drizzle-kit generate` → `wrangler d1 execute` locally → promote to remote — safe, repeatable, zero-downtime schema changes

---

## Tech Stack Summary

```
Frontend      Next.js 15, React, TanStack Query, shadcn/ui, Lucide Icons
Styling       Vanilla CSS, OKLCH color space, CSS variables (dark theme)
Backend       Next.js API Routes, Cloudflare Workers
Auth          Better Auth (email OTP, Google OAuth, GitHub OAuth)
Database      Cloudflare D1 (SQLite), Drizzle ORM
Cache         Cloudflare KV
Queue         Cloudflare Queue
Email         Resend
Deployment    Cloudflare Pages (web), Wrangler (workers)
Monorepo      pnpm workspaces + Turborepo
Language      TypeScript (strict mode, across entire monorepo)
```

---

*Built by Pratik. Open-source.*
