import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createDb } from "@xaply/db";
import { isSession, requireSession } from "@/lib/api-auth";
import { queryLinksSummary } from "@/lib/links-list-query";
import { API_READ_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `read:${session.user.id}`,
    ...API_READ_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  const db = createDb(env.DB);
  const summary = await queryLinksSummary(db, session.user.id);

  return NextResponse.json(summary);
}
