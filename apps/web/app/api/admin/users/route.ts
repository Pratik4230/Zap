import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createDb } from "@xaply/db";
import { NextRequest, NextResponse } from "next/server";
import { isAdminSession, requireAdmin } from "@/lib/admin-auth";
import { isSession, requireSession } from "@/lib/api-auth";
import { parseAdminUsersListParams } from "@/lib/filter-admin-users";
import { queryAdminUsersPage } from "@/lib/admin-users-query";
import { API_READ_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const adminSession = requireAdmin(session, env);
  if (!isAdminSession(adminSession)) return adminSession;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `admin:users:${adminSession.user.id}`,
    ...API_READ_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  const params = parseAdminUsersListParams(request.nextUrl.searchParams);
  const db = createDb(env.DB);
  const result = await queryAdminUsersPage(db, params);

  return NextResponse.json(result);
}
