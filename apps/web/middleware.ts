import { type NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/analytics", "/settings", "/admin"];
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"];

const SESSION_COOKIE_NAMES = new Set([
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
]);

/** Fast cookie presence check. Avoids a worker self-fetch on every navigation/RSC request. */
function hasSessionCookie(request: NextRequest): boolean {
  const raw = request.headers.get("cookie");
  if (!raw) return false;

  for (const part of raw.split(";")) {
    const name = part.trim().split("=")[0]?.trim();
    if (name && SESSION_COOKIE_NAMES.has(name)) return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (pathname === "/") {
    if (hasSessionCookie(request)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isProtected) {
    if (!hasSessionCookie(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isAuthRoute) {
    if (hasSessionCookie(request)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/analytics/:path*", "/settings/:path*", "/admin/:path*", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"],
};
