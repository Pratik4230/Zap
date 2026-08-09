/**
 * Map inbound Android App Link / `xaply://` URLs onto Expo Router paths.
 * Mobile routes: `/links/:id`, `/links/:id/analytics` (push uses the same).
 */

const APP_HOSTS = new Set(["xaply.in", "www.xaply.in"]);

function pathnameAndSearch(input: string): { pathname: string; search: string } {
  try {
    if (/^[a-z][a-z0-9+.-]*:/i.test(input)) {
      const url = new URL(input);
      return { pathname: url.pathname, search: url.search };
    }
  } catch {
    // fall through — treat as path
  }

  const q = input.indexOf("?");
  if (q === -1) {
    return { pathname: input.startsWith("/") ? input : `/${input}`, search: "" };
  }
  return {
    pathname: input.slice(0, q).startsWith("/")
      ? input.slice(0, q)
      : `/${input.slice(0, q)}`,
    search: input.slice(q),
  };
}

/** Rewrite an inbound system path to an in-app route. */
export function rewriteAppLinkPath(path: string): string {
  let raw = path.trim();
  if (!raw) return "/";

  try {
    if (/^https?:\/\//i.test(raw)) {
      const url = new URL(raw);
      if (!APP_HOSTS.has(url.hostname)) return path;
      raw = `${url.pathname}${url.search}`;
    } else if (/^xaply:/i.test(raw)) {
      const url = new URL(raw);
      // `xaply:///links/id` → /links/id
      // `xaply://links/id` → host links, path /id
      if (url.hostname && !APP_HOSTS.has(url.hostname)) {
        raw = `/${url.hostname}${url.pathname}${url.search}`.replace(
          /\/{2,}/g,
          "/"
        );
      } else {
        raw = `${url.pathname || "/"}${url.search}`;
      }
    }
  } catch {
    return path;
  }

  const { pathname, search } = pathnameAndSearch(raw);
  const normalized = pathname.replace(/\/+$/, "") || "/";

  const dashAnalytics = normalized.match(
    /^\/dashboard\/links\/([^/]+)\/analytics$/
  );
  if (dashAnalytics) {
    return `/links/${dashAnalytics[1]}/analytics${search}`;
  }

  const dashDetail = normalized.match(/^\/dashboard\/links\/([^/]+)$/);
  if (dashDetail) {
    return `/links/${dashDetail[1]}${search}`;
  }

  if (/^\/links\/[^/]+(?:\/analytics)?$/.test(normalized)) {
    return `${normalized}${search}`;
  }

  // Web dashboard root → mobile links tab (`/`).
  if (normalized === "/dashboard") {
    return `/${search}`;
  }
  if (normalized === "/settings" || normalized === "/analytics") {
    return `${normalized}${search}`;
  }

  // Other xaply.in paths without a mobile screen → entry redirect handles it.
  if (normalized !== "/") {
    return `/${search}`;
  }

  return `${normalized}${search}`;
}
