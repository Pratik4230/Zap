/**
 * Public env for the mobile client.
 * Set EXPO_PUBLIC_API_URL in `.env` (see `.env.example`).
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ?? "https://xaply.in";
