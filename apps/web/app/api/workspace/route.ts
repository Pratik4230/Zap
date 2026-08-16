import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import {
  BUSINESS_MAX_OWNED_WORKSPACES,
  MAX_WORKSPACE_MEMBERSHIPS,
  countOwnedWorkspaces,
  countUserWorkspaceMemberships,
  listUserWorkspaces,
  renameOwnedWorkspace,
  validateProfileName,
  isWorkspaceMutationError,
} from "@xaply/db";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { API_READ_LIMIT, LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  requireWorkspaceAccess,
  withWorkspaceCookie,
} from "@/lib/workspace-context";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `workspace:${session.user.id}`,
      ...API_READ_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    const [workspaces, ownedCount, membershipCount] = await Promise.all([
      listUserWorkspaces(env.DB, session.user.id, session.user.name),
      countOwnedWorkspaces(env.DB, session.user.id),
      countUserWorkspaceMemberships(env.DB, session.user.id),
    ]);

    const ownerIsBusiness = workspaces.some(
      (workspace) => workspace.isOwner && workspace.plan === "business"
    );

    return NextResponse.json({
      current: access,
      workspaces,
      limits: {
        ownedCount,
        maxOwned: BUSINESS_MAX_OWNED_WORKSPACES,
        membershipCount,
        maxMemberships: MAX_WORKSPACE_MEMBERSHIPS,
        canCreate:
          ownerIsBusiness &&
          ownedCount < BUSINESS_MAX_OWNED_WORKSPACES &&
          membershipCount < MAX_WORKSPACE_MEMBERSHIPS,
      },
    });
  });
}

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const workspaceId =
      body && typeof body === "object" && "workspaceId" in body
        ? String((body as { workspaceId: unknown }).workspaceId)
        : "";

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const workspaces = await listUserWorkspaces(env.DB, session.user.id, session.user.name);
    const match = workspaces.find((workspace) => workspace.id === workspaceId && workspace.usable);
    if (!match) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return withWorkspaceCookie(
      NextResponse.json({ ok: true, workspaceId }),
      workspaceId
    );
  });
}

export async function PATCH(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `workspace-rename:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const nameResult = validateProfileName(
      body && typeof body === "object" && "name" in body
        ? (body as { name: unknown }).name
        : undefined
    );
    if (!nameResult.ok) {
      return NextResponse.json({ error: nameResult.error }, { status: 400 });
    }

    const access = await requireWorkspaceAccess(request, env, session);
    try {
      await renameOwnedWorkspace(
        env.DB,
        session.user.id,
        access.workspaceId,
        nameResult.value
      );
    } catch (error) {
      if (isWorkspaceMutationError(error)) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, name: nameResult.value });
  });
}
