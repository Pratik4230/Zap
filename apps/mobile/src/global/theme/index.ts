/**
 * Xaply brand tokens — aligned with apps/web `globals.css`
 * primary ≈ oklch(0.769 0.188 70.08)
 */
export const colors = {
  /** Root / SystemUI / Stack contentStyle — keep in sync with app.json backgroundColor */
  background: "#121212",
  foreground: "#f7f7f7",
  muted: "#9a9a9a",
  primary: "#fe9a00",
  primaryForeground: "#000000",
  destructive: "#ef4444",
  warning: "#f59e0b",
  surface: "#1c1c1c",
  /** Native splash / adaptive icon plate (web PWA #050505) */
  splash: "#050505",
} as const;

export const brand = {
  name: "Xaply",
} as const;
