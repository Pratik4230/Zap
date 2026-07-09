import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createDb, validateProfileName } from "@xaply/db";
import { users } from "@xaply/db/schema";
import { eq } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { LINK_MUTATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function PATCH(request: NextRequest) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `profile:${session.user.id}`,
    ...LINK_MUTATE_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nameResult = validateProfileName((body as { name?: unknown })?.name);
  if (!nameResult.ok) {
    return NextResponse.json({ error: nameResult.error }, { status: 400 });
  }

  const db = createDb(env.DB);
  const [updated] = await db
    .update(users)
    .set({ name: nameResult.value, updatedAt: new Date() })
    .where(eq(users.id, session.user.id))
    .returning({ id: users.id, name: users.name, email: users.email });

  return NextResponse.json({ user: updated });
}
