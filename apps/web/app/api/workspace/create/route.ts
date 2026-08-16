import { getCloudflareContext } from "@opennextjs/cloudflare"
import { NextRequest, NextResponse } from "next/server"
import {
  createOwnedWorkspace,
  validateProfileName,
  isWorkspaceMutationError,
} from "@xaply/db"
import { isSession, requireSession } from "@/lib/api-auth"
import { withApiHandler } from "@/lib/api-handler"
import {
  LINK_MUTATE_LIMIT,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit"
import { withWorkspaceCookie } from "@/lib/workspace-context"

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext()
  return withApiHandler(env, "/api/workspace/create", async () => {
    const session = await requireSession(request, env)
    if (!isSession(session)) return session

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `workspace-create:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    })
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60)

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    const nameResult = validateProfileName(
      body && typeof body === "object" && "name" in body
        ? (body as { name: unknown }).name
        : undefined
    )
    if (!nameResult.ok) {
      return NextResponse.json({ error: nameResult.error }, { status: 400 })
    }

    try {
      const workspace = await createOwnedWorkspace(
        env.DB,
        session.user.id,
        nameResult.value
      )
      return withWorkspaceCookie(
        NextResponse.json({ ok: true, workspace }),
        workspace.id
      )
    } catch (error) {
      if (isWorkspaceMutationError(error)) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status }
        )
      }
      throw error
    }
  })
}
