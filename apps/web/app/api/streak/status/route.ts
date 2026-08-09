import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { getStreakStatus } from "@xaply/db";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { API_READ_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/streak/status", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `streak-status:${session.user.id}`,
      ...API_READ_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const status = await getStreakStatus(env.DB, session.user.id);
    return NextResponse.json(status);
  });
}
