import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createAuth } from "@/lib/auth";
import { createDb } from "@xaply/db";
import { users } from "@xaply/db/schema";
import { eq } from "drizzle-orm";

async function getSession(request: NextRequest, env: CloudflareEnv) {
  const auth = createAuth(env.DB, env);
  return auth.api.getSession({ headers: request.headers });
}

export async function PATCH(request: NextRequest) {
  const { env } = getCloudflareContext();
  const session = await getSession(request, env);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { name?: string };
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = createDb(env.DB);
  const [updated] = await db
    .update(users)
    .set({ name: name.trim(), updatedAt: new Date() })
    .where(eq(users.id, session.user.id))
    .returning({ id: users.id, name: users.name, email: users.email });

  return NextResponse.json({ user: updated });
}
