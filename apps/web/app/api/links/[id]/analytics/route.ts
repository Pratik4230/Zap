import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createDb, getUserPlan } from "@xaply/db";
import { links } from "@xaply/db/schema";
import { and, eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import {
  getAnalyticsRangeFromRequest,
  queryLinkAnalytics,
} from "@/lib/analytics-query";
import { API_READ_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `link-analytics:${session.user.id}`,
    ...API_READ_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  const { id } = await params;
  if (!id || typeof id !== "string" || id.length > 64) {
    return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
  }

  const db = createDb(env.DB);
  const plan = await getUserPlan(env.DB, session.user.id);
  const range = getAnalyticsRangeFromRequest(plan, request.nextUrl.searchParams);

  const [link] = await db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.userId, session.user.id)))
    .limit(1);

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const analytics = await queryLinkAnalytics(
    env.DB,
    link.id,
    range.rangeDays,
    range.rangeStart,
    range.chartBucket
  );

  return NextResponse.json({
    link: {
      id: link.id,
      slug: link.slug,
      domain: link.domain,
      destinationUrl: link.destinationUrl,
      title: link.title,
      status: link.status,
      clickCount: link.clickCount,
      clickLimit: link.clickLimit,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    },
    ...analytics,
    plan: range.plan,
    rangeDays: range.rangeDays,
    maxRangeDays: range.maxRangeDays,
    rangeLabel: range.rangeLabel,
  });
}
