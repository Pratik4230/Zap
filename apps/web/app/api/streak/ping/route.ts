import { getCloudflareContext } from "@opennextjs/cloudflare"
import { NextRequest, NextResponse } from "next/server"
import { recordStreakDay, getStreakStatus } from "@xaply/db"
import { isSession, requireSession } from "@/lib/api-auth"
import { withApiHandler } from "@/lib/api-handler"
import { rateLimit } from "@/lib/rate-limit"
import { utcDateString } from "@xaply/db"

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext()
  return withApiHandler(env, "/api/streak/ping", async () => {
    const session = await requireSession(request, env)
    if (!isSession(session)) return session

    const today = utcDateString()
    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `streak-ping:${session.user.id}:${today}`,
      limit: 3,
      windowSeconds: 60 * 60 * 25,
    })
    if (!rl.success) {
      const status = await getStreakStatus(env.DB, session.user.id)
      return NextResponse.json(status)
    }

    const { streak, isNew } = await recordStreakDay(env.DB, session.user.id)
    const status = await getStreakStatus(env.DB, session.user.id)

    return NextResponse.json({ ...status, streak, isNew })
  })
}
