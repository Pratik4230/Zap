import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createDb, isExpoPushToken } from "@xaply/db";
import { pushTokens } from "@xaply/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * Register / refresh an Expo push token for the signed-in user.
 * Mobile calls this after getExpoPushTokenAsync.
 */
export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/push/token", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `push-token:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const token =
      typeof (body as { token?: unknown })?.token === "string"
        ? (body as { token: string }).token.trim()
        : "";
    const platformRaw = (body as { platform?: unknown })?.platform;
    const platform =
      platformRaw === "android" || platformRaw === "ios"
        ? platformRaw
        : "unknown";

    if (!token || !isExpoPushToken(token)) {
      return NextResponse.json(
        { error: "Invalid Expo push token" },
        { status: 400 }
      );
    }

    const db = createDb(env.DB);
    const now = new Date();

    const existing = await db
      .select({ id: pushTokens.id })
      .from(pushTokens)
      .where(eq(pushTokens.token, token))
      .limit(1);

    if (existing[0]) {
      await db
        .update(pushTokens)
        .set({
          userId: session.user.id,
          platform,
          updatedAt: now,
        })
        .where(eq(pushTokens.id, existing[0].id));
    } else {
      await db.insert(pushTokens).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        token,
        platform,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ ok: true });
  });
}

/** Remove a token (e.g. on sign-out). */
export async function DELETE(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/push/token", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const token =
      typeof (body as { token?: unknown })?.token === "string"
        ? (body as { token: string }).token.trim()
        : "";
    if (!token) {
      return NextResponse.json({ error: "token required" }, { status: 400 });
    }

    const db = createDb(env.DB);
    await db
      .delete(pushTokens)
      .where(
        and(eq(pushTokens.userId, session.user.id), eq(pushTokens.token, token))
      );

    return NextResponse.json({ ok: true });
  });
}
