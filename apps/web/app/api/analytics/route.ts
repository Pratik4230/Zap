import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createDb } from "@xaply/db";
import { links, clicks } from "@xaply/db/schema";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import { API_READ_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `analytics:${session.user.id}`,
    ...API_READ_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  const db = createDb(env.DB);
  const userId = session.user.id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [dailyRaw, topLinks, countriesRaw, devicesRaw] = await Promise.all([
    db
      .select({
        date: sql<string>`date(${clicks.timestamp}, 'unixepoch')`,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(and(eq(links.userId, userId), gte(clicks.timestamp, sevenDaysAgo)))
      .groupBy(sql`date(${clicks.timestamp}, 'unixepoch')`)
      .orderBy(sql`date(${clicks.timestamp}, 'unixepoch')`),

    db
      .select({
        slug: links.slug,
        domain: links.domain,
        title: links.title,
        clicks: links.clickCount,
      })
      .from(links)
      .where(eq(links.userId, userId))
      .orderBy(desc(links.clickCount))
      .limit(5),

    db
      .select({
        country: clicks.country,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(and(eq(links.userId, userId), gte(clicks.timestamp, sevenDaysAgo)))
      .groupBy(clicks.country)
      .orderBy(sql`count(*) desc`)
      .limit(5),

    db
      .select({
        device: clicks.device,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(and(eq(links.userId, userId), gte(clicks.timestamp, sevenDaysAgo)))
      .groupBy(clicks.device)
      .orderBy(sql`count(*) desc`),
  ]);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const dailyMap = new Map(dailyRaw.map((r) => [r.date, r.count]));
  const daily = last7Days.map((date) => ({
    date,
    label: new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
    clicks: Number(dailyMap.get(date) ?? 0),
  }));

  const totalClicks = daily.reduce((sum, d) => sum + d.clicks, 0);

  const totalDeviceClicks = devicesRaw.reduce((sum, d) => sum + Number(d.count), 0);
  const devices = devicesRaw.map((d) => ({
    device: d.device ?? "unknown",
    count: Number(d.count),
    pct: totalDeviceClicks > 0 ? Math.round((Number(d.count) / totalDeviceClicks) * 100) : 0,
  }));

  const countries = countriesRaw.map((c) => ({
    country: c.country ?? "Unknown",
    count: Number(c.count),
  }));

  return NextResponse.json({ daily, totalClicks, topLinks, countries, devices });
}
