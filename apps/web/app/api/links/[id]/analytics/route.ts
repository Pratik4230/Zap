import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createDb } from "@xaply/db";
import { links, clicks } from "@xaply/db/schema";
import { and, eq, gte, isNotNull, ne, sql } from "drizzle-orm";
import { isSession, requireSession } from "@/lib/api-auth";
import {
  buildLast7DaysDaily,
  formatCityRows,
  formatCountRows,
  formatDeviceBreakdown,
} from "@/lib/analytics-helpers";
import { API_READ_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { env } = getCloudflareContext();
  const session = await requireSession(request, env);
  if (!isSession(session)) return session;

  const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `link-analytics:${session.user.id}`,
    ...API_READ_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  const { id } = await params;
  if (!id || typeof id !== "string" || id.length > 64) {
    return NextResponse.json({ error: "Invalid link id" }, { status: 400 });
  }

  const db = createDb(env.DB);

  const [link] = await db
    .select()
    .from(links)
    .where(and(eq(links.id, id), eq(links.userId, session.user.id)))
    .limit(1);

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const linkFilter = and(eq(clicks.linkId, link.id), gte(clicks.timestamp, sevenDaysAgo));
  const cityFilter = and(linkFilter, isNotNull(clicks.city), ne(clicks.city, ""));

  const [dailyRaw, countriesRaw, citiesRaw, devicesRaw, browsersRaw, osRaw, referrersRaw] =
    await Promise.all([
      db
        .select({
          date: sql<string>`date(${clicks.timestamp}, 'unixepoch')`,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(linkFilter)
        .groupBy(sql`date(${clicks.timestamp}, 'unixepoch')`)
        .orderBy(sql`date(${clicks.timestamp}, 'unixepoch')`),

      db
        .select({
          value: clicks.country,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(linkFilter)
        .groupBy(clicks.country)
        .orderBy(sql`count(*) desc`)
        .limit(5),

      db
        .select({
          city: clicks.city,
          country: clicks.country,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(cityFilter)
        .groupBy(clicks.city, clicks.country)
        .orderBy(sql`count(*) desc`)
        .limit(7),

      db
        .select({
          device: clicks.device,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(linkFilter)
        .groupBy(clicks.device)
        .orderBy(sql`count(*) desc`),

      db
        .select({
          value: clicks.browser,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(linkFilter)
        .groupBy(clicks.browser)
        .orderBy(sql`count(*) desc`)
        .limit(5),

      db
        .select({
          value: clicks.os,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(linkFilter)
        .groupBy(clicks.os)
        .orderBy(sql`count(*) desc`)
        .limit(5),

      db
        .select({
          value: clicks.referrer,
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(linkFilter)
        .groupBy(clicks.referrer)
        .orderBy(sql`count(*) desc`)
        .limit(5),
    ]);

  const { daily, totalClicks } = buildLast7DaysDaily(dailyRaw);

  return NextResponse.json({
    link: {
      id: link.id,
      slug: link.slug,
      domain: link.domain,
      destinationUrl: link.destinationUrl,
      title: link.title,
      status: link.status,
      clickCount: link.clickCount,
      clickLimit: link.clickLimit,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    },
    daily,
    totalClicks,
    countries: formatCountRows(countriesRaw, "Unknown"),
    cities: formatCityRows(citiesRaw),
    devices: formatDeviceBreakdown(devicesRaw),
    browsers: formatCountRows(browsersRaw, "Unknown"),
    os: formatCountRows(osRaw, "Unknown"),
    referrers: formatCountRows(referrersRaw, "Direct"),
  });
}
