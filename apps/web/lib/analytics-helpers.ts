import type { AnalyticsChartBucket } from "@xaply/db";

type BucketRow = { bucket: string; count: number | string };

function formatBucketLabel(date: Date, mode: AnalyticsChartBucket): string {
  if (mode === "month") {
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  if (mode === "week") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function buildBucketedChartSeries(
  rows: BucketRow[],
  rangeDays: number,
  bucket: AnalyticsChartBucket
) {
  const bucketMap = new Map(rows.map((row) => [row.bucket, Number(row.count)]));

  if (bucket === "day") {
    return buildDailySeriesFromMap(bucketMap, rangeDays);
  }

  const slots: { key: string; date: Date }[] = [];
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (rangeDays - 1));

  if (bucket === "week") {
    const cursor = new Date(start);
    while (cursor <= end) {
      const year = cursor.getFullYear();
      const week = getIsoWeek(cursor);
      const key = `${year}-W${String(week).padStart(2, "0")}`;
      if (!slots.some((slot) => slot.key === key)) {
        slots.push({ key, date: new Date(cursor) });
      }
      cursor.setDate(cursor.getDate() + 7);
    }
  } else {
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= endMonth) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      slots.push({ key, date: new Date(cursor) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  const daily = slots.map(({ key, date }) => ({
    date: key,
    label: formatBucketLabel(date, bucket),
    clicks: bucketMap.get(key) ?? 0,
  }));

  const totalClicks = daily.reduce((sum, point) => sum + point.clicks, 0);
  return { daily, totalClicks };
}

function buildDailySeriesFromMap(bucketMap: Map<string, number>, rangeDays: number) {
  const dates = Array.from({ length: rangeDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (rangeDays - 1 - i));
    return d.toISOString().split("T")[0]!;
  });

  const useShortLabels = rangeDays > 14;
  const daily = dates.map((date) => ({
    date,
    label: useShortLabels
      ? new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
    clicks: bucketMap.get(date) ?? 0,
  }));

  const totalClicks = daily.reduce((sum, point) => sum + point.clicks, 0);
  return { daily, totalClicks };
}

function getIsoWeek(date: Date): number {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86_400_000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7
    )
  );
}

export function buildDailySeries(
  dailyRaw: { date: string; count: number | string }[],
  chartDays: number
) {
  const bucketMap = new Map(dailyRaw.map((row) => [row.date, Number(row.count)]));
  return buildDailySeriesFromMap(bucketMap, chartDays);
}

export function buildLast7DaysDaily(dailyRaw: { date: string; count: number | string }[]) {
  return buildDailySeries(dailyRaw, 7);
}

export function formatDeviceBreakdown(
  devicesRaw: { device: string | null; count: number | string }[]
) {
  const totalDeviceClicks = devicesRaw.reduce((sum, d) => sum + Number(d.count), 0);
  return devicesRaw.map((d) => ({
    device: d.device ?? "unknown",
    count: Number(d.count),
    pct: totalDeviceClicks > 0 ? Math.round((Number(d.count) / totalDeviceClicks) * 100) : 0,
  }));
}

export function formatCountRows<T extends string | null>(
  rows: { value: T; count: number | string }[],
  emptyLabel: string
) {
  return rows.map((r) => ({
    label: r.value?.trim() || emptyLabel,
    count: Number(r.count),
  }));
}

export function formatCityRows(
  rows: { city: string | null; country: string | null; count: number | string }[]
) {
  return rows
    .filter((r) => r.city?.trim())
    .map((r) => {
      const city = r.city!.trim();
      const country = r.country?.trim();
      return {
        label: country ? `${city}, ${country}` : city,
        count: Number(r.count),
      };
    });
}
