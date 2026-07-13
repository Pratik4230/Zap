import { NextResponse } from "next/server";
import type { Session } from "@/lib/auth";

export function getAdminEmail(env: Pick<CloudflareEnv, "ADMIN_EMAIL">): string | undefined {
  const value = env.ADMIN_EMAIL?.trim();
  return value || undefined;
}

export function isAdminEmail(
  email: string | null | undefined,
  adminEmail: string | undefined
): boolean {
  if (!adminEmail) return false;
  return email?.toLowerCase() === adminEmail.toLowerCase();
}

export function requireAdmin(
  session: Session,
  env: Pick<CloudflareEnv, "ADMIN_EMAIL">
): Session | NextResponse {
  if (!isAdminEmail(session.user.email, getAdminEmail(env))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}

export function isAdminSession(session: Session | NextResponse): session is Session {
  return !(session instanceof NextResponse);
}
