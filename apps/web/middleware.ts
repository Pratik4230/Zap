import { type NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/analytics", "/settings"];
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"];

async function hasValidSession(request: NextRequest): Promise<boolean> {
  try {
    const res = await fetch(new URL("/api/auth/get-session", request.url), {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { user?: unknown };
    return Boolean(data?.user);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isAuthRoute = AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected) {
    const valid = await hasValidSession(request);
    if (!valid) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (isAuthRoute) {
    const valid = await hasValidSession(request);
    if (valid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/analytics/:path*", "/settings/:path*", "/sign-in", "/sign-up", "/forgot-password", "/reset-password", "/verify-email"],
};
