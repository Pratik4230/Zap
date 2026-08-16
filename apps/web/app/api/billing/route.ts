import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { getUserPlan } from "@xaply/db";
import { isDodoBillingConfigured, isDodoBusinessConfigured } from "@/lib/dodo-billing";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { API_READ_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/billing", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `billing:${session.user.id}`,
      ...API_READ_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const plan = await getUserPlan(env.DB, session.user.id);

    return NextResponse.json({
      plan,
      checkoutEnabled: isDodoBillingConfigured(env),
      businessCheckout: isDodoBusinessConfigured(env) && isDodoBillingConfigured(env),
    });
  });
}
