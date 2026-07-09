export function buildLast7DaysDaily(dailyRaw: { date: string; count: number | string }[]) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const dailyMap = new Map(dailyRaw.map((r) => [r.date, Number(r.count)]));
  const daily = last7Days.map((date) => ({
    date,
    label: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
    clicks: dailyMap.get(date) ?? 0,
  }));

  const totalClicks = daily.reduce((sum, d) => sum + d.clicks, 0);
  return { daily, totalClicks };
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
