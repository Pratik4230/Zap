import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import {
  canManageWebhooks,
  createDb,
  generateWebhookSecret,
  isWebhookEvent,
  parseWebhookEvents,
  WEBHOOK_EVENTS,
} from "@xaply/db";
import { workspaceWebhooks } from "@xaply/db/schema";
import { eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { API_READ_LIMIT, LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { forbidden, requireWorkspaceAccess } from "@/lib/workspace-context";

function publicWebhook(row: typeof workspaceWebhooks.$inferSelect, secret?: string) {
  return {
    id: row.id,
    url: row.url,
    events: parseWebhookEvents(row.events),
    enabled: row.enabled,
    lastDeliveredAt: row.lastDeliveredAt,
    lastError: row.lastError,
    createdAt: row.createdAt,
    ...(secret ? { secret } : {}),
  };
}

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/webhooks", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `webhooks-read:${session.user.id}`,
      ...API_READ_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    if (!canManageWebhooks(access.role)) return forbidden("You cannot manage webhooks.");
    if (access.plan !== "business") {
      return NextResponse.json({ error: "Webhooks require the Business plan." }, { status: 403 });
    }

    const db = createDb(env.DB);
    const rows = await db
      .select()
      .from(workspaceWebhooks)
      .where(eq(workspaceWebhooks.workspaceId, access.workspaceId));

    return NextResponse.json({
      events: WEBHOOK_EVENTS,
      webhooks: rows.map((row) => publicWebhook(row)),
    });
  });
}

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/webhooks", async () => {
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const url =
      body && typeof body === "object" && "url" in body
        ? String((body as { url: unknown }).url).trim()
        : "";
    const eventsRaw =
      body && typeof body === "object" && "events" in body
        ? (body as { events: unknown }).events
        : WEBHOOK_EVENTS;

    if (!URL.canParse(url) || !url.startsWith("https://")) {
      return NextResponse.json({ error: "Webhook URL must be https" }, { status: 400 });
    }

    const events = Array.isArray(eventsRaw)
      ? eventsRaw.filter((item): item is string => typeof item === "string").filter(isWebhookEvent)
      : [...WEBHOOK_EVENTS];
    if (events.length === 0) {
      return NextResponse.json({ error: "Select at least one event" }, { status: 400 });
    }

    const secret = generateWebhookSecret();
    const db = createDb(env.DB);
    const [created] = await db
      .insert(workspaceWebhooks)
      .values({
        id: crypto.randomUUID(),
        workspaceId: access.workspaceId,
        url,
        secret,
        events: JSON.stringify(events),
        enabled: true,
        createdBy: session.user.id,
      })
      .returning();

    if (!created) {
      return NextResponse.json({ error: "Could not create webhook" }, { status: 500 });
    }

    return NextResponse.json({ webhook: publicWebhook(created, secret) }, { status: 201 });
  });
}
