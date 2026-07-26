# Xaply Mobile — Agent Guide

Android-first Expo app for Xaply (URL shortener). Mirror authenticated web flows: auth, links, analytics, settings.

## Hard rules

1. **Expo HAS CHANGED** — read the **exact SDK 57** docs before writing code. Prefer versioned URLs (`/versions/v57.0.0/`), not unversioned `/latest/` when they diverge.
2. **Do not invent APIs** — confirm component props from Expo UI `.d.ts` / docs before use.
3. **Every Jetpack Compose tree** must be wrapped in `Host` from `@expo/ui/jetpack-compose`.
4. **No HeroUI Native** for v1 (heavier peers; not true Compose native).
5. **API base** = production `https://xaply.in` (auth + REST).
6. **Auth v1** = email + password + OTP only. Google later.
7. Follow this file’s **TODO** in order; update status when a step finishes (`pending` → `in_progress` → `done`).

## Package manager

**Use `pnpm` (repo root).**

| Fact | Detail |
| --- | --- |
| Monorepo | Root `packageManager` is `pnpm@9.0.0`; `pnpm-workspace.yaml` includes `apps/*` |
| Mobile today | Scaffold left a local `package-lock.json` + nested `.git` — **remove those**; do not use npm/yarn inside `apps/mobile` |
| Install | From repo root: `pnpm install`. Add Expo deps with `pnpm --filter mobile exec expo install <pkg>` or `cd apps/mobile && pnpm exec expo install <pkg>` |
| Why not npm here | Dual lockfiles fight the workspace; shared `@xaply/*` packages expect pnpm |

Expo CLI still works under pnpm (`expo start`, `expo run:android`).

## Stack (locked)

| Layer | Choice |
| --- | --- |
| Runtime | Expo SDK **57**, Expo Router, React 19, RN 0.86 |
| UI (primary) | **`@expo/ui` Jetpack Compose** — native Material 3 feel + speed |
| Icons (Compose) | **`@expo/material-symbols`** — import icons as `@expo/material-symbols/home.xml` (no hand-written XML). Do not use `@expo/vector-icons` for new code. |
| Styling (secondary) | **Uniwind** — RN shells, safe areas, non-Compose wrappers ([docs](https://docs.uniwind.dev/llms.txt)) |
| Data | TanStack Query v5 → `https://xaply.in/api/*` |
| Auth | Better Auth + `@better-auth/expo` + SecureStore; server already has `bearer()` |
| Out of scope v1 | HeroUI Native, Google OAuth, in-app billing checkout, admin |

## Important docs (keep current)

### Expo SDK 57

- [Expo SDK 57 docs root](https://docs.expo.dev/versions/v57.0.0/)
- [Expo UI overview](https://docs.expo.dev/versions/v57.0.0/sdk/ui/)
- [Jetpack Compose (v57)](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/) — [available components](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/#available-components)
- [AlertDialog](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/alertdialog/) · [Badge](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/badge/) · [BadgedBox](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/badgedbox/)
- [Compose Icon + Material Symbols](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/icon/)
- [Jetpack Compose (latest mirror)](https://docs.expo.dev/versions/latest/sdk/ui/jetpack-compose/#available-components) — cross-check only; implement against **v57**
- Mobile gallery route: `/expo-ui` (demos follow official examples)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [llms.txt (Expo)](https://docs.expo.dev/llms.txt)

### Uniwind

- [Uniwind llms.txt](https://docs.uniwind.dev/llms.txt)
- [Quickstart](https://docs.uniwind.dev/quickstart.md)
- [Monorepos](https://docs.uniwind.dev/monorepos.md)
- [Theming](https://docs.uniwind.dev/theming/basics.md)
- [metro.config.js](https://docs.uniwind.dev/api/metro-config.md)

### Auth & product

- [Better Auth — Expo](https://better-auth.com/docs/integrations/expo)
- Web API lives in `apps/web` (`/api/auth/*`, `/api/links`, `/api/analytics`, `/api/profile`, `/api/billing`)
- Shared types/limits: `@xaply/db` (client-safe only — no D1)

---

## TODO — build the entire app

Update the **Status** column as you work. Do not skip prerequisites.

### Phase 0 — Monorepo & project hygiene

| ID | Task | Status |
| --- | --- | --- |
| 0.1 | Remove nested `apps/mobile/.git` (and git metadata) so mobile is only tracked by root repo | `done` |
| 0.2 | Remove `apps/mobile/package-lock.json`; rely on root `pnpm-lock.yaml` | `done` |
| 0.3 | Ensure mobile is a normal workspace package (`pnpm install` from root works) | `done` |
| 0.4 | Rename app identity: `name` / `slug` / scheme → `xaply` (not `acme` / `mobile`) | `done` |
| 0.5 | Add `EXPO_PUBLIC_API_URL=https://xaply.in` (or equivalent) and document it | `done` |
| 0.6 | Install `@expo/ui` via `expo install` (`@expo/ui@57.0.7`). Android `Host` runtime check deferred with 0.8 | `done` |
| 0.7 | Confirm Uniwind + Metro monorepo config per Uniwind monorepo docs | `done` |
| 0.8 | Replace scaffold welcome screen with a minimal Compose smoke screen | `done` (gallery `/expo-ui` + `@expo/material-symbols`) |

**Phase 0 complete.**

### Phase 1 — Auth (email / password / OTP)

| ID | Task | Status |
| --- | --- | --- |
| 1.1 | Server: add Better Auth `expo()` plugin + `trustedOrigins` for `xaply://` (and dev `exp://` if needed) in `apps/web` | `pending` |
| 1.2 | Mobile: `@better-auth/expo` client + `expo-secure-store` + `expo-network` | `pending` |
| 1.3 | Auth screens: sign-in, sign-up (Compose `TextField` / `Button`) | `pending` |
| 1.4 | Email OTP verify flow | `pending` |
| 1.5 | Forgot / reset password | `pending` |
| 1.6 | Session gate: unauthenticated → auth stack; authenticated → app tabs | `pending` |
| 1.7 | Authenticated `fetch` helper: attach session cookie via `authClient.getCookie()` to production API | `pending` |
| 1.8 | _(Later)_ Google OAuth deep links — **blocked until post-MVP** | `pending` |

### Phase 2 — App shell & links

| ID | Task | Status |
| --- | --- | --- |
| 2.1 | TanStack Query provider + API client typed against web routes | `pending` |
| 2.2 | Tab / nav shell (Compose `NavigationBar` or Expo Router tabs) | `pending` |
| 2.3 | Links list: search/filter + infinite scroll (`LazyColumn` / pull-to-refresh) | `pending` |
| 2.4 | Create link (destination, optional slug/title) + plan-limit errors | `pending` |
| 2.5 | Copy short URL + system share sheet | `pending` |
| 2.6 | Link detail: edit destination/title, pause/resume, delete, expiry / click limit / password fields | `pending` |
| 2.7 | Dashboard summary stats (links, clicks, active rate) | `pending` |

### Phase 3 — Analytics

| ID | Task | Status |
| --- | --- | --- |
| 3.1 | Account-wide analytics screen (`GET /api/analytics`) | `pending` |
| 3.2 | Per-link analytics (`GET /api/links/[id]/analytics`) | `pending` |
| 3.3 | Charts / breakdowns: time series, countries, devices, browsers, referrers (keep UI simple; native feel over fancy charts) | `pending` |

### Phase 4 — Settings & polish

| ID | Task | Status |
| --- | --- | --- |
| 4.1 | Profile settings (`PATCH /api/profile`) | `pending` |
| 4.2 | Show plan / billing status (read-only); deep-link to web for Pro upgrade | `pending` |
| 4.3 | Sign out | `pending` |
| 4.4 | QR code for a link (optional; match web if cheap) | `pending` |
| 4.5 | Empty / loading / error states consistently | `pending` |
| 4.6 | App icons, splash, Android package id | `pending` |
| 4.7 | EAS build profile for Android (preview + production) | `pending` |

### Phase 5 — Hardening (post-MVP)

| ID | Task | Status |
| --- | --- | --- |
| 5.1 | Google sign-in (Expo + Better Auth) | `pending` |
| 5.2 | Offline / retry UX | `pending` |
| 5.3 | Deep links into link detail | `pending` |
| 5.4 | Optional: schema `androidUrl` / store fields if product needs them | `pending` |

---

## Screen map (target)

```
(auth)
  sign-in | sign-up | verify-otp | forgot-password | reset-password

(app)
  tabs
    links/           → list + FAB create
    links/[id]       → detail + actions
    links/[id]/analytics
    analytics/       → account analytics
    settings/        → profile, plan, sign out
```

## Definition of done (MVP)

- [ ] Install/run via root **pnpm**; no nested git / npm lockfile
- [ ] Sign up → OTP → session persists (SecureStore)
- [ ] Create / list / edit / pause / delete links against **production** API
- [ ] Copy short link; see basic stats + per-link analytics
- [ ] UI is Compose-first on Android (native controls), Uniwind only where RN wrappers need it
- [ ] Statuses above marked `done` through Phase 4 (5.x can remain pending)
