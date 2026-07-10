# Xaply

Xaply is an open-source URL shortener built on Cloudflare. Turn long URLs into short links, share them anywhere, and see who clicked them.

- **xaply.in** - dashboard, sign-in, link management, analytics
- **go.xaply.in** - fast redirects for every short link

## What it does

1. Create a short link (custom slug or random)
2. Share `go.xaply.in/your-slug`
3. Visitors get redirected instantly
4. You see clicks, countries, cities, devices, and more in the dashboard

## Features

**Links**
- Custom or random slugs
- Edit destination, title, pause/resume, delete
- Expiry by date or max clicks
- Password-protected links
- QR codes (generated in the browser, nothing stored)

**Analytics**
- Global dashboard: clicks over last 7 days, top links, countries, cities, devices
- Per-link analytics: referrers, browsers, OS, device breakdown
- Geo from Cloudflare (country + city), device/OS from User-Agent

**Dashboard**
- Server-side search and filters
- Infinite scroll for large link lists
- Stats cards: total links, clicks, active rate

**Auth & security**
- Email sign-up, Google and GitHub OAuth
- Rate limits on API and redirects
- Input validation on every link field
- Session-protected dashboard

**Redirect engine**
- Sub-10ms redirects at the edge
- KV cache for hot slugs
- Password prompt page before redirect
- Daily cron marks expired links
- Click events sent to a queue (non-blocking)

## Infrastructure

Monorepo (pnpm + Turborepo). Everything runs on Cloudflare.

| Piece | Tech | Role |
| --- | --- | --- |
| Web app | Next.js on Cloudflare Pages | UI, API, auth |
| Redirect worker | Cloudflare Worker | `go.xaply.in` redirects |
| Analytics worker | Cloudflare Worker + Queue | Saves clicks, updates counts |
| Database | D1 (SQLite) | Users, links, clicks |
| Cache | KV | Slug to link cache for fast redirects |
| Queue | Cloudflare Queue | Async click processing |
| Auth | Better Auth | Sessions, OAuth, email |
| ORM | Drizzle | Shared schema in `packages/db` |

One D1 database (`zap-db`) is shared by all three apps.

```
Visitor -> go.xaply.in (redirect worker)
              |-> KV cache / D1 lookup
              |-> password check (if set)
              |-> 302 redirect
              |-> click event -> Queue -> analytics worker -> D1

You -> xaply.in (Next.js) -> API -> D1
```

## Project layout

| Path | App |
| --- | --- |
| `apps/web` | Dashboard + API |
| `apps/redirect-worker` | Redirects + expire cron |
| `apps/analytics-worker` | Click ingestion |
| `packages/db` | Schema + migrations |

## Install

```bash
pnpm install
```

Create `apps/web/.dev.vars`:

```env
NEXTJS_ENV=development
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

First-time database:

```bash
cd apps/web
npx wrangler d1 execute zap-db --local --file=../../packages/db/drizzle/0000_silky_the_professor.sql
```

## Run

```bash
pnpm dev
```

| Service | URL |
| --- | --- |
| Web | http://localhost:3000 |
| Redirect worker | http://localhost:8789 |
| Analytics worker | http://localhost:8788 |

Optional mock data for local testing:

```bash
cd apps/web && pnpm run db:seed
```

## Database

Schema: `packages/db/src/schema.ts`  
Migrations: `packages/db/drizzle/`

Always apply with `wrangler d1 execute`. Do not use `drizzle-kit migrate` on D1.

### Schema change workflow

```bash
# 1. Edit packages/db/src/schema.ts
# 2. Generate migration
cd packages/db && pnpm run db:generate

# 3. Local
cd apps/web
npx wrangler d1 execute zap-db --local --file=../../packages/db/drizzle/<migration>.sql

# 4. Production
npx wrangler d1 execute zap-db --remote --file=../../packages/db/drizzle/<migration>.sql

# 5. Redeploy all apps
cd apps/web && NEXT_PUBLIC_APP_URL=https://xaply.in pnpm run deploy
cd ../redirect-worker && pnpm run deploy
cd ../analytics-worker && pnpm run deploy
```

### Query D1

```bash
cd apps/web
npx wrangler d1 execute zap-db --local --command "SELECT * FROM links LIMIT 5;"
npx wrangler d1 execute zap-db --remote --command "SELECT * FROM links LIMIT 5;"
```

Local D1 data: `apps/web/.wrangler/state/v3/d1/`

## Deploy

Deploy the app you changed. DB schema changes need a remote migration first, then all three apps.

```bash
# Web
cd apps/web
NEXT_PUBLIC_APP_URL=https://xaply.in pnpm run deploy

# Redirect worker
cd apps/redirect-worker
npx wrangler secret put LINK_PASSWORD_SECRET   # first time only
pnpm run deploy

# Analytics worker
cd apps/analytics-worker && pnpm run deploy
```

| Changed | Redeploy |
| --- | --- |
| `apps/web/` | web |
| `apps/redirect-worker/` | redirect-worker |
| `apps/analytics-worker/` | analytics-worker |
| `packages/db/` | migrate remote D1, then all three |

### Production secrets (web, one-time)

```bash
cd apps/web
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_SECRET
```

### OAuth callbacks

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/github
https://xaply.in/api/auth/callback/google
https://xaply.in/api/auth/callback/github
```
