import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import {
  getAnalyticsRangeFromRequest,
  queryAccountAnalytics,
} from "@/lib/analytics-query";
import { API_READ_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { requireWorkspaceAccess } from "@/lib/workspace-context";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/analytics", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `analytics:${session.user.id}`,
      ...API_READ_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const access = await requireWorkspaceAccess(request, env, session);
    const range = getAnalyticsRangeFromRequest(access.plan, request.nextUrl.searchParams);
    const analytics = await queryAccountAnalytics(
      env.DB,
      access.workspaceId,
      range.rangeDays,
      range.rangeStart,
      range.chartBucket
    );

    return NextResponse.json({
      ...analytics,
      plan: range.plan,
      rangeDays: range.rangeDays,
      maxRangeDays: range.maxRangeDays,
      rangeLabel: range.rangeLabel,
    });
  });
}
