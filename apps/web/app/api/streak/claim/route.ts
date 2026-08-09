import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { claimStreakReward } from "@xaply/db";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/streak/claim", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `streak-claim:${session.user.id}`,
      limit: 5,
      windowSeconds: 60 * 60,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const result = await claimStreakReward(env.DB, env.ZAP_CACHE, session.user.id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      proGrantedUntil: result.proGrantedUntil.toISOString(),
    });
  });
}
