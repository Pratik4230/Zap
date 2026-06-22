# Zap — URL Shortener

A high-performance URL shortener built on Cloudflare's edge infrastructure. Monorepo powered by Turborepo + pnpm.

## Stack

| Layer | Technology |
|---|---|
| Web app | Next.js + OpenNext.js (Cloudflare Pages) |
| Auth | Better Auth + D1 |
| DB | Cloudflare D1 (SQLite) + Drizzle ORM |
| Edge redirect | Cloudflare Worker |
| Analytics | Cloudflare Worker + Queue |
| Email | Resend |
| Package manager | pnpm workspaces |

## Apps & Packages

```
apps/
  web/               → Next.js app (dashboard, auth)
  redirect-worker/   → Cloudflare Worker — handles short link redirects
  analytics-worker/  → Cloudflare Worker — processes click analytics
packages/
  db/                → Drizzle schema + migrations
```

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment

```bash
bash setup.sh
```

Create `apps/web/.dev.vars` with the following:

```
NEXTJS_ENV=development
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

RESEND_API_KEY=re_your_key_here

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

> `.dev.vars` is Wrangler's env file. Next.js reads it via OpenNext.js — do **not** use `.env` for the web app.

### 3. Apply DB migration (first time only)

```bash
cd apps/web
npx wrangler d1 execute zap-db --local --file=../../packages/db/drizzle/0000_silky_the_professor.sql
```

### 4. Start dev servers

```bash
pnpm dev
```

- Web app → `http://localhost:3000`
- Redirect worker → `http://localhost:8787`
- Analytics worker → `http://localhost:8788`

## OAuth Setup

**Google** → [console.cloud.google.com](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client

Authorized redirect URI:
```
http://localhost:3000/api/auth/callback/google
```

**GitHub** → [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps

Authorization callback URL:
```
http://localhost:3000/api/auth/callback/github
```

> Add both local and production URLs to the same OAuth app.

## Database

The local D1 database lives at:
```
apps/web/.wrangler/state/v3/d1/
```

### Query local DB
```bash
cd apps/web
npx wrangler d1 execute zap-db --local --command "SELECT * FROM user;"
```

### View in Drizzle Studio
```bash
cd packages/db
npx drizzle-kit studio
```

### Schema changes workflow
```bash
# 1. Edit packages/db/src/schema.ts

# 2. Generate new migration
cd packages/db
npx drizzle-kit generate

# 3. Apply to local D1
cd apps/web
npx wrangler d1 execute zap-db --local --file=../../packages/db/drizzle/<new-migration>.sql

# 4. Apply to production D1
npx wrangler d1 execute zap-db --remote --file=../../packages/db/drizzle/<new-migration>.sql
```

> `drizzle-kit migrate` does not work with D1. Always use `wrangler d1 execute` to apply migrations.

## Deployment

```bash
# Build + preview locally (with Wrangler runtime — full D1 access)
cd apps/web
pnpm preview

# Deploy to Cloudflare Pages
pnpm deploy

# Set production secrets
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_SECRET
npx wrangler secret put BETTER_AUTH_SECRET
```

## Environment Files

| File | Purpose | Committed |
|---|---|---|
| `.env` | Root-level shared vars | ❌ gitignored |
| `apps/web/.dev.vars` | Wrangler local secrets | ❌ gitignored |
| `.env.example` | Template (no secrets) | ✅ committed |
