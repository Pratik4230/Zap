/**
 * Holds an inbound App Link / deep-link path when the user is logged out.
 * `Stack.Protected` hides `(app)` routes until auth; after sign-in we
 * `router.replace` the pending path so they land on the intended screen.
 */

let pendingPath: string | null = null;

/** True for authenticated app paths we care about restoring post-login. */
export function isRestorableAppPath(path: string): boolean {
  const pathname = path.split("?")[0] ?? path;
  return (
    /^\/links\/[^/]+(?:\/analytics)?$/.test(pathname) ||
    /^\/invite\/[^/]+$/.test(pathname)
  );
}

export function setPendingDeepLink(path: string): void {
  if (!isRestorableAppPath(path)) return;
  pendingPath = path;
}

export function consumePendingDeepLink(): string | null {
  const next = pendingPath;
  pendingPath = null;
  return next;
}

export function peekPendingDeepLink(): string | null {
  return pendingPath;
}
