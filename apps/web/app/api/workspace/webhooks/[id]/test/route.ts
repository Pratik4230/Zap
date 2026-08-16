import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { canManageWebhooks, createDb, deliverWorkspaceWebhooks } from "@xaply/db";
import { workspaceWebhooks } from "@xaply/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { forbidden, requireWorkspaceAccess } from "@/lib/workspace-context";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/workspace/webhooks/[id]/test", async () => {
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
    const db = createDb(env.DB);
    const [hook] = await db
      .select({ id: workspaceWebhooks.id })
      .from(workspaceWebhooks)
      .where(
        and(
          eq(workspaceWebhooks.id, id),
          eq(workspaceWebhooks.workspaceId, access.workspaceId)
        )
      )
      .limit(1);

    if (!hook) return NextResponse.json({ error: "Webhook not found" }, { status: 404 });

    await deliverWorkspaceWebhooks(env.DB, access.workspaceId, "link.created", {
      ping: true,
      webhookId: hook.id,
    });

    return NextResponse.json({ ok: true });
  });
}
