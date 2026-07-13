import {
  analyticsRangeStart,
  formatAnalyticsRangeLabel,
  getAnalyticsChartBucket,
  getAnalyticsHistoryDays,
  parseAnalyticsRangeParam,
  resolveAnalyticsRange,
  type WorkspacePlan,
} from "@xaply/db";
import { createDb } from "@xaply/db";
import { links, clicks } from "@xaply/db/schema";
import { and, eq, gte, isNotNull, ne, sql, desc } from "drizzle-orm";
import {
  buildBucketedChartSeries,
  buildDailySeries,
  formatCityRows,
  formatCountRows,
  formatDeviceBreakdown,
} from "@/lib/analytics-helpers";

export function getAnalyticsRangeFromRequest(
  plan: WorkspacePlan,
  searchParams: URLSearchParams
) {
  const rangeDays = resolveAnalyticsRange(
    plan,
    parseAnalyticsRangeParam(searchParams.get("range"))
  );
  const rangeStart = analyticsRangeStart(rangeDays);
  const chartBucket = getAnalyticsChartBucket(rangeDays);

  return {
    rangeDays,
    rangeStart,
    chartBucket,
    rangeLabel: formatAnalyticsRangeLabel(rangeDays),
    maxRangeDays: getAnalyticsHistoryDays(plan),
    plan,
  };
}

function chartGroupSql(bucket: ReturnType<typeof getAnalyticsChartBucket>) {
  if (bucket === "week") {
    return sql<string>`strftime('%Y-W%W', ${clicks.timestamp}, 'unixepoch')`;
  }
  if (bucket === "month") {
    return sql<string>`strftime('%Y-%m', ${clicks.timestamp}, 'unixepoch')`;
  }
  return sql<string>`date(${clicks.timestamp}, 'unixepoch')`;
}

export async function queryAccountAnalytics(
  db: D1Database,
  userId: string,
  rangeDays: number,
  rangeStart: Date,
  chartBucket: ReturnType<typeof getAnalyticsChartBucket>
) {
  const drizzle = createDb(db);
  const rangeWindow = and(eq(links.userId, userId), gte(clicks.timestamp, rangeStart));
  const cityFilter = and(rangeWindow, isNotNull(clicks.city), ne(clicks.city, ""));

  const [chartRaw, topLinksRaw, countriesRaw, citiesRaw, devicesRaw] = await Promise.all([
    drizzle
      .select({
        bucket: chartGroupSql(chartBucket),
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(rangeWindow)
      .groupBy(chartGroupSql(chartBucket))
      .orderBy(chartGroupSql(chartBucket)),

    drizzle
      .select({
        slug: links.slug,
        domain: links.domain,
        title: links.title,
        clicks: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(rangeWindow)
      .groupBy(links.id)
      .orderBy(sql`count(*) desc`)
      .limit(5),

    drizzle
      .select({
        country: clicks.country,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(rangeWindow)
      .groupBy(clicks.country)
      .orderBy(sql`count(*) desc`)
      .limit(5),

    drizzle
      .select({
        city: clicks.city,
        country: clicks.country,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(cityFilter)
      .groupBy(clicks.city, clicks.country)
      .orderBy(sql`count(*) desc`)
      .limit(7),

    drizzle
      .select({
        device: clicks.device,
        count: sql<number>`count(*)`,
      })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(rangeWindow)
      .groupBy(clicks.device)
      .orderBy(sql`count(*) desc`),
  ]);

  const { daily, totalClicks } =
    chartBucket === "day"
      ? buildDailySeries(
          chartRaw.map((row) => ({ date: row.bucket, count: row.count })),
          rangeDays
        )
      : buildBucketedChartSeries(chartRaw, rangeDays, chartBucket);

  return {
    daily,
    totalClicks,
    topLinks: topLinksRaw.map((link) => ({
      slug: link.slug,
      domain: link.domain,
      title: link.title,
      clicks: Number(link.clicks),
    })),
    countries: countriesRaw.map((c) => ({
      country: c.country ?? "Unknown",
      count: Number(c.count),
    })),
    cities: formatCityRows(citiesRaw),
    devices: formatDeviceBreakdown(devicesRaw),
  };
}

export async function queryLinkAnalytics(
  db: D1Database,
  linkId: string,
  rangeDays: number,
  rangeStart: Date,
  chartBucket: ReturnType<typeof getAnalyticsChartBucket>
) {
  const drizzle = createDb(db);
  const rangeFilter = and(eq(clicks.linkId, linkId), gte(clicks.timestamp, rangeStart));
  const cityFilter = and(rangeFilter, isNotNull(clicks.city), ne(clicks.city, ""));

  const [chartRaw, countriesRaw, citiesRaw, devicesRaw, browsersRaw, osRaw, referrersRaw] =
    await Promise.all([
      drizzle
        .select({
          bucket: chartGroupSql(chartBucket),
          count: sql<number>`count(*)`,
        })
        .from(clicks)
        .where(rangeFilter)
        .groupBy(chartGroupSql(chartBucket))
        .orderBy(chartGroupSql(chartBucket)),

      drizzle
        .select({ value: clicks.country, count: sql<number>`count(*)` })
        .from(clicks)
        .where(rangeFilter)
        .groupBy(clicks.country)
        .orderBy(sql`count(*) desc`)
        .limit(5),

      drizzle
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

      drizzle
        .select({ device: clicks.device, count: sql<number>`count(*)` })
        .from(clicks)
        .where(rangeFilter)
        .groupBy(clicks.device)
        .orderBy(sql`count(*) desc`),

      drizzle
        .select({ value: clicks.browser, count: sql<number>`count(*)` })
        .from(clicks)
        .where(rangeFilter)
        .groupBy(clicks.browser)
        .orderBy(sql`count(*) desc`)
        .limit(5),

      drizzle
        .select({ value: clicks.os, count: sql<number>`count(*)` })
        .from(clicks)
        .where(rangeFilter)
        .groupBy(clicks.os)
        .orderBy(sql`count(*) desc`)
        .limit(5),

      drizzle
        .select({ value: clicks.referrer, count: sql<number>`count(*)` })
        .from(clicks)
        .where(rangeFilter)
        .groupBy(clicks.referrer)
        .orderBy(sql`count(*) desc`)
        .limit(5),
    ]);

  const { daily, totalClicks } =
    chartBucket === "day"
      ? buildDailySeries(
          chartRaw.map((row) => ({ date: row.bucket, count: row.count })),
          rangeDays
        )
      : buildBucketedChartSeries(chartRaw, rangeDays, chartBucket);

  return {
    daily,
    totalClicks,
    countries: formatCountRows(countriesRaw, "Unknown"),
    cities: formatCityRows(citiesRaw),
    devices: formatDeviceBreakdown(devicesRaw),
    browsers: formatCountRows(browsersRaw, "Unknown"),
    os: formatCountRows(osRaw, "Unknown"),
    referrers: formatCountRows(referrersRaw, "Direct"),
  };
}
