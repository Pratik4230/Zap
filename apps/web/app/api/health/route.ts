import { getCloudflareContext } from "@opennextjs/cloudflare";
import { checkD1Health, checkKvHealth } from "@xaply/db";
import { NextResponse } from "next/server";

export async function GET() {
  const startedAt = Date.now();
  const { env } = getCloudflareContext();

  const [d1, kv] = await Promise.all([
    checkD1Health(env.DB),
    checkKvHealth(env.ZAP_CACHE),
  ]);

  const checks = { d1, kv };
  const healthy = d1.ok && kv.ok;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checks,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
