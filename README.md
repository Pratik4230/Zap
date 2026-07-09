# Xaply — URL Shortener

URL shortener on Cloudflare: `xaply.in` (app) + `go.xaply.in` (redirects).


| App              | Path                    | Deploy                          |
| ---------------- | ----------------------- | ------------------------------- |
| Web (Next.js)    | `apps/web`              | `pnpm run deploy`               |
| Redirect worker  | `apps/redirect-worker`  | `pnpm run deploy`               |
| Analytics worker | `apps/analytics-worker` | `pnpm run deploy`               |
| DB schema        | `packages/` `db`        | migrate, then redeploy all apps |


## Local dev

```bash
pnpm install
# create apps/web/.dev.vars (see below)
cd apps/web && npx wrangler d1 execute zap-db --local --file=../../packages/db/drizzle/0000_silky_the_professor.sql
pnpm dev
```

`apps/web/.dev.vars`:

```
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

- Web → `localhost:3000` · Redirect → `localhost:8787` · Analytics → `localhost:8788`
- Local D1 data → `apps/web/.wrangler/state/v3/d1/`

## Database (D1 + Drizzle)

**One DB (`zap-db`) shared by all apps.** Schema lives in `packages/db/src/schema.ts`.

### First-time setup

```bash
# local
cd apps/web
npx wrangler d1 execute zap-db --local --file=../../packages/db/drizzle/0000_silky_the_professor.sql

# production
npx wrangler d1 execute zap-db --remote --file=../../packages/db/drizzle/0000_silky_the_professor.sql
```

### Schema change workflow

```bash
# 1. Edit packages/db/src/schema.ts
# 2. Generate migration
cd packages/db && npx drizzle-kit generate

# 3. Apply locally
cd apps/web
npx wrangler d1 execute zap-db --local --file=../../packages/db/drizzle/<migration>.sql

# 4. Apply to production
npx wrangler d1 execute zap-db --remote --file=../../packages/db/drizzle/<migration>.sql

# 5. Redeploy ALL apps (db package is shared)
cd apps/web && NEXT_PUBLIC_APP_URL=https://xaply.in pnpm run deploy
cd ../redirect-worker && pnpm run deploy
cd ../analytics-worker && pnpm run deploy
```

> Don't use `drizzle-kit migrate` with D1 — always `wrangler d1 execute`.

### Useful DB commands

```bash
cd apps/web

# query local
npx wrangler d1 execute zap-db --local --command "SELECT * FROM links LIMIT 5;"

# query production
npx wrangler d1 execute zap-db --remote --command "SELECT * FROM links LIMIT 5;"

# Drizzle Studio (local sqlite)
cd packages/db && npx drizzle-kit studio
```

## Deploy

**Code changes don't go live until you redeploy the changed app.**

```bash
# web only
cd apps/web
NEXT_PUBLIC_APP_URL=https://xaply.in pnpm run deploy

# redirect worker only
cd apps/redirect-worker && pnpm run deploy

# analytics worker only
cd apps/analytics-worker && pnpm run deploy
```


| Changed                  | Redeploy                                   |
| ------------------------ | ------------------------------------------ |
| `apps/web/`              | web                                        |
| `apps/redirect-worker/`  | redirect-worker                            |
| `apps/analytics-worker/` | analytics-worker                           |
| `packages/db/`           | migrate remote D1 → redeploy all 3 apps (see above) |


### Production secrets (web app, one-time)

```bash
cd apps/web
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_SECRET
```

`BETTER_AUTH_URL` and OAuth client IDs are in `apps/web/wrangler.jsonc`.

## OAuth callbacks

Add both local + production to Google/GitHub:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/github
https://xaply.in/api/auth/callback/google
https://xaply.in/api/auth/callback/github
```

