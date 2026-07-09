import { NextRequest, NextResponse } from "next/server";
import { createAuth } from "@/lib/auth";
import type { Session } from "@/lib/auth";

export async function requireSession(
  request: NextRequest,
  env: CloudflareEnv
): Promise<Session | NextResponse> {
  const auth = createAuth(env.DB, env);
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export function isSession(session: Session | NextResponse): session is Session {
  return !(session instanceof NextResponse);
}
