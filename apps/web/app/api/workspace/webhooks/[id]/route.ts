import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import {
  canManageWebhooks,
  createDb,
  isWebhookEvent,
  parseWebhookEvents,
} from "@xaply/db";
import { workspaceWebhooks } from "@xaply/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { forbidden, requireWorkspaceAccess } from "@/lib/workspace-context";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/webhooks/[id]", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `webhooks-mutate:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    if (!canManageWebhooks(access.role)) return forbidden("You cannot manage webhooks.");
    if (access.plan !== "business") {
      return NextResponse.json({ error: "Webhooks require the Business plan." }, { status: 403 });
    }

    const { id } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const updates: {
      url?: string;
      events?: string;
      enabled?: boolean;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (body && typeof body === "object") {
      const input = body as { url?: unknown; events?: unknown; enabled?: unknown };
      if (input.url !== undefined) {
        const url = String(input.url).trim();
        if (!URL.canParse(url) || !url.startsWith("https://")) {
          return NextResponse.json({ error: "Webhook URL must be https" }, { status: 400 });
        }
        updates.url = url;
      }
      if (input.events !== undefined) {
        const events = Array.isArray(input.events)
          ? input.events.filter((item): item is string => typeof item === "string").filter(isWebhookEvent)
          : [];
        if (events.length === 0) {
          return NextResponse.json({ error: "Select at least one event" }, { status: 400 });
        }
        updates.events = JSON.stringify(events);
      }
      if (input.enabled !== undefined) {
        updates.enabled = Boolean(input.enabled);
      }
    }

    const db = createDb(env.DB);
    const [updated] = await db
      .update(workspaceWebhooks)
      .set(updates)
      .where(
        and(
          eq(workspaceWebhooks.id, id),
          eq(workspaceWebhooks.workspaceId, access.workspaceId)
        )
      )
      .returning();

    if (!updated) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    return NextResponse.json({
      webhook: {
        id: updated.id,
        url: updated.url,
        events: parseWebhookEvents(updated.events),
        enabled: updated.enabled,
        lastDeliveredAt: updated.lastDeliveredAt,
        lastError: updated.lastError,
        createdAt: updated.createdAt,
      },
    });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/webhooks/[id]", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `webhooks-mutate:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    if (!canManageWebhooks(access.role)) return forbidden("You cannot manage webhooks.");

    const { id } = await params;
    const db = createDb(env.DB);
    const [deleted] = await db
      .delete(workspaceWebhooks)
      .where(
        and(
          eq(workspaceWebhooks.id, id),
          eq(workspaceWebhooks.workspaceId, access.workspaceId)
        )
      )
      .returning({ id: workspaceWebhooks.id });

    if (!deleted) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  });
}
