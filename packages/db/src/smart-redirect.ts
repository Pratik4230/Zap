import { assertSafeRedirectUrl } from "./validation";

export type RedirectOs = "android" | "ios" | "other";

/** Lightweight OS sniff for redirect targeting (not analytics). */
export function detectRedirectOs(userAgent: string): RedirectOs {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  return "other";
}

type SmartRedirectLink = {
  destinationUrl: string;
  iosUrl?: string | null;
  iosStoreUrl?: string | null;
  androidUrl?: string | null;
  androidStoreUrl?: string | null;
};

/**
 * Pick destination for a short-link hit:
 * - Android → androidUrl → androidStoreUrl → destinationUrl
 * - iOS → iosUrl → iosStoreUrl → destinationUrl
 * - else → destinationUrl
 *
 * Skips blank / unsafe candidates and falls through.
 */
export function resolveRedirectDestination(
  link: SmartRedirectLink,
  userAgent: string
): string {
  const os = detectRedirectOs(userAgent);
  const candidates: Array<string | null | undefined> =
    os === "android"
      ? [link.androidUrl, link.androidStoreUrl, link.destinationUrl]
      : os === "ios"
        ? [link.iosUrl, link.iosStoreUrl, link.destinationUrl]
        : [link.destinationUrl];

  for (const url of candidates) {
    if (url && assertSafeRedirectUrl(url)) return url;
  }

  return link.destinationUrl;
}
