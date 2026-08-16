import { NextRequest, NextResponse } from "next/server";
import {
  resolveWorkspaceAccess,
  type WorkspaceAccess,
  type WorkspaceRole,
} from "@xaply/db";
import type { Session } from "@/lib/auth";

export const WORKSPACE_COOKIE = "xaply-workspace-id";
export const WORKSPACE_HEADER = "x-workspace-id";

export function readRequestedWorkspaceId(request: NextRequest): string | null {
  const header = request.headers.get(WORKSPACE_HEADER)?.trim();
  if (header) return header;
  const cookie = request.cookies.get(WORKSPACE_COOKIE)?.value?.trim();
  return cookie || null;
}

export async function requireWorkspaceAccess(
  request: NextRequest,
  env: CloudflareEnv,
  session: Session
): Promise<WorkspaceAccess> {
  return resolveWorkspaceAccess(
    env.DB,
    session.user.id,
    session.user.name,
    readRequestedWorkspaceId(request)
  );
}

export function workspaceCookie(workspaceId: string) {
  return {
    name: WORKSPACE_COOKIE,
    value: workspaceId,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export function withWorkspaceCookie(response: NextResponse, workspaceId: string) {
  response.cookies.set(workspaceCookie(workspaceId));
  return response;
}

export function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function requireRole(
  access: WorkspaceAccess,
  allowed: WorkspaceRole[]
): NextResponse | null {
  if (allowed.includes(access.role)) return null;
  return forbidden("You do not have permission to do that.");
}
