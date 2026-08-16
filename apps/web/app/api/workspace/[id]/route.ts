import { getCloudflareContext } from "@opennextjs/cloudflare"
import { NextRequest, NextResponse } from "next/server"
import { deleteOwnedWorkspace, isWorkspaceMutationError } from "@xaply/db"
import { isSession, requireSession } from "@/lib/api-auth"
import { withApiHandler } from "@/lib/api-handler"
import {
  LINK_MUTATE_LIMIT,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit"
import { withWorkspaceCookie } from "@/lib/workspace-context"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext()
  return withApiHandler(env, "/api/workspace/[id]", async () => {
    const session = await requireSession(request, env)
    if (!isSession(session)) return session

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `workspace-delete:${session.user.id}`,
      ...LINK_MUTATE_LIMIT,
    })
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60)

    const { id } = await params
    if (!id) {
      return NextResponse.json(
        { error: "Workspace id is required" },
        { status: 400 }
      )
    }

    try {
      const { fallbackWorkspaceId } = await deleteOwnedWorkspace(
        env.DB,
        env.ZAP_CACHE,
        session.user.id,
        id
      )
      return withWorkspaceCookie(
        NextResponse.json({ ok: true, workspaceId: fallbackWorkspaceId }),
        fallbackWorkspaceId
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
