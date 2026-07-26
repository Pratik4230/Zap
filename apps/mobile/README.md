# Xaply Mobile

Android-first Expo app for [Xaply](https://xaply.in). See [AGENTS.md](./AGENTS.md) for stack, docs, and build TODO.

## Package manager

Use **pnpm** from the repo root (not npm).

```sh
# from repo root
pnpm install
cd apps/mobile
pnpm start
```

Add Expo-compatible deps with:

```sh
cd apps/mobile
pnpm exec expo install <package>
```

## Env

Copy `.env.example` → `.env` (already set for production):

```
EXPO_PUBLIC_API_URL=https://xaply.in
```

## Stack

- Expo SDK 57 + Expo Router
- `@expo/ui` Jetpack Compose (primary UI)
- `@expo/material-symbols` for Compose icons
- Uniwind (RN shell styling)
