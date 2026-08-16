import { useMemo, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { PieChart } from "react-native-gifted-charts";
import {
  Column,
  FilterChip,
  FlowRow,
  Host,
  LazyColumn,
  ListItem,
  PullToRefreshBox,
  Text,
} from "@expo/ui/jetpack-compose";
import {
  fillMaxSize,
  fillMaxWidth,
  padding,
  weight,
} from "@expo/ui/jetpack-compose/modifiers";
import { apiClient } from "@/global/api/client";
import { getApiErrorMessage } from "@/global/api/errors";
import { queryKeys } from "@/global/api/query-keys";
import type { CountRow, DeviceBreakdown } from "@/global/api/types";
import { EmptyState, ErrorState, LoadingState } from "@/global/components/query-state";
import { ScreenShell } from "@/global/components/screen-shell";
import { colors } from "@/global/theme";

const RANGE_OPTIONS = [7, 30, 90] as const;
const PIE_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#a855f7", // purple
  "#f97316", // orange
  "#06b6d4", // cyan
  "#eab308", // yellow
  "#ec4899", // pink
] as const;

function BreakdownSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; count: number; suffix?: string }>;
}) {
  return (
    <Column verticalArrangement={{ spacedBy: 6 }} modifiers={[fillMaxWidth(), padding(14, 0, 14, 0)]}>
      <Text color={colors.foreground} style={{ fontSize: 15, fontWeight: "700" }}>
        {title}
      </Text>
      {rows.length === 0 ? (
        <Text color={colors.muted} style={{ fontSize: 13 }}>
          No data yet.
        </Text>
      ) : (
        rows.slice(0, 10).map((row) => (
          <ListItem
            key={`${title}-${row.label}`}
            colors={{
              containerColor: colors.surface,
              contentColor: colors.foreground,
              trailingContentColor: colors.muted,
            }}
          >
            <ListItem.HeadlineContent>
              <Text maxLines={1} overflow="ellipsis">
                {row.label}
              </Text>
            </ListItem.HeadlineContent>
            <ListItem.TrailingContent>
              <Text>
                {row.count}
                {row.suffix ?? ""}
              </Text>
            </ListItem.TrailingContent>
          </ListItem>
        ))
      )}
    </Column>
  );
}

function PieSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const pieData = items
    .slice(0, 6)
    .map((item, index) => ({
      value: item.value,
      color: PIE_COLORS[index % PIE_COLORS.length],
      text: `${Math.round((item.value / (total || 1)) * 100)}%`,
    }));

  return (
    <Column verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth(), padding(14, 0, 14, 0)]}>
      <Text color={colors.foreground} style={{ fontSize: 15, fontWeight: "700" }}>
        {title}
      </Text>
      {pieData.length === 0 ? (
        <Text color={colors.muted} style={{ fontSize: 13 }}>
          No data yet.
        </Text>
      ) : (
        <>
          <View style={{ alignItems: "center" }}>
            <PieChart
              data={pieData}
              donut
              radius={78}
              innerRadius={45}
              innerCircleColor={colors.background}
              textColor={colors.foreground}
              textSize={10}
              showText
              focusOnPress
              showValuesAsLabels
            />
          </View>
          {items.slice(0, 6).map((item, index) => (
            <ListItem
              key={`${title}-legend-${item.label}`}
              colors={{
                containerColor: colors.surface,
                contentColor: colors.foreground,
                trailingContentColor: colors.muted,
              }}
            >
              <ListItem.LeadingContent>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                  }}
                />
              </ListItem.LeadingContent>
              <ListItem.HeadlineContent>
                <Text maxLines={1} overflow="ellipsis">
                  {item.label}
                </Text>
              </ListItem.HeadlineContent>
              <ListItem.TrailingContent>
                <Text>{item.value}</Text>
              </ListItem.TrailingContent>
            </ListItem>
          ))}
        </>
      )}
    </Column>
  );
}

export default function LinkAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [rangeDays, setRangeDays] = useState<number>(30);

  const analyticsQuery = useQuery({
    enabled: !!id,
    queryKey: queryKeys.links.analytics(id ?? "", rangeDays),
    queryFn: () => apiClient.links.analytics(id as string, rangeDays),
  });

  const analytics = analyticsQuery.data;

  const countries = useMemo(
    () =>
      (analytics?.countries ?? []).map((row: CountRow) => ({
        label: row.label,
        count: row.count,
      })),
    [analytics?.countries]
  );
  const cities = useMemo(
    () =>
      (analytics?.cities ?? []).map((row: CountRow) => ({
        label: row.label,
        count: row.count,
      })),
    [analytics?.cities]
  );
  const devices = useMemo(
    () =>
      (analytics?.devices ?? []).map((row: DeviceBreakdown) => ({
        label: row.device,
        count: row.count,
        suffix: ` (${Math.round(row.pct)}%)`,
      })),
    [analytics?.devices]
  );
  const browsers = useMemo(
    () =>
      (analytics?.browsers ?? []).map((row: CountRow) => ({
        label: row.label,
        count: row.count,
      })),
    [analytics?.browsers]
  );
  const os = useMemo(
    () =>
      (analytics?.os ?? []).map((row: CountRow) => ({
        label: row.label,
        count: row.count,
      })),
    [analytics?.os]
  );
  const referrers = useMemo(
    () =>
      (analytics?.referrers ?? []).map((row: CountRow) => ({
        label: row.label,
        count: row.count,
      })),
    [analytics?.referrers]
  );
  const countryPieItems = useMemo(
    () => countries.map((row) => ({ label: row.label, value: row.count })),
    [countries]
  );
  const devicePieItems = useMemo(
    () => devices.map((row) => ({ label: row.label, value: row.count })),
    [devices]
  );

  const title = analytics?.link.title?.trim() || (analytics ? `${analytics.link.domain}/${analytics.link.slug}` : "Link analytics");
  const subtitle = analytics
    ? `${analytics.rangeLabel} • ${analytics.totalClicks} clicks`
    : "Per-link analytics";

  return (
    <ScreenShell edges={["top", "bottom"]}>
      <Host colorScheme="dark" seedColor={colors.primary} style={{ flex: 1, width: "100%" }}>
        <Column modifiers={[fillMaxSize(), fillMaxWidth(), padding(14, 4, 14, 8)]} verticalArrangement={{ spacedBy: 10 }}>
          <Column verticalArrangement={{ spacedBy: 3 }}>
            <Text color={colors.foreground} style={{ fontSize: 22, fontWeight: "700" }}>
              {title}
            </Text>
            <Text color={colors.muted} style={{ fontSize: 13 }}>
              {subtitle}
            </Text>
          </Column>

          <FlowRow horizontalArrangement={{ spacedBy: 8 }} verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
            {RANGE_OPTIONS.map((option) => (
              <FilterChip
                key={option}
                selected={rangeDays === option}
                onClick={() => setRangeDays(option)}
                colors={{
                  selectedContainerColor: colors.primary,
                  selectedLabelColor: colors.primaryForeground,
                  labelColor: colors.muted,
                  containerColor: colors.surface,
                }}
              >
                <FilterChip.Label>
                  <Text>{option}d</Text>
                </FilterChip.Label>
              </FilterChip>
            ))}
          </FlowRow>

          <PullToRefreshBox
            isRefreshing={analyticsQuery.isRefetching}
            onRefresh={() => void analyticsQuery.refetch()}
            contentAlignment="topCenter"
            indicator={{ color: colors.primary, containerColor: colors.background }}
            modifiers={[fillMaxWidth(), weight(1)]}
          >
            <LazyColumn verticalArrangement={{ spacedBy: 8 }} contentPadding={{ bottom: 18 }} modifiers={[fillMaxSize()]}>
              {analytics ? (
                <ListItem
                  colors={{
                    containerColor: colors.surface,
                    contentColor: colors.foreground,
                    supportingContentColor: colors.muted,
                  }}
                  modifiers={[fillMaxWidth(), padding(14, 0, 14, 0)]}
                >
                  <ListItem.HeadlineContent>
                    <Text style={{ fontSize: 17, fontWeight: "700" }}>{analytics.totalClicks}</Text>
                  </ListItem.HeadlineContent>
                  <ListItem.SupportingContent>
                    <Text>Total clicks • {analytics.link.status}</Text>
                  </ListItem.SupportingContent>
                </ListItem>
              ) : null}

              {analyticsQuery.error ? (
                <ErrorState
                  padded
                  message={getApiErrorMessage(analyticsQuery.error)}
                  onRetry={() => void analyticsQuery.refetch()}
                />
              ) : null}

              {!analyticsQuery.isLoading && !analyticsQuery.error && analytics ? (
                analytics.totalClicks === 0 ? (
                  <EmptyState
                    padded
                    title="No clicks yet"
                    description="Share this short link to start collecting analytics."
                  />
                ) : (
                  <>
                    <PieSection title="Countries" items={countryPieItems} />
                    <BreakdownSection title="Cities" rows={cities} />
                    <PieSection title="Devices" items={devicePieItems} />
                    <BreakdownSection title="Browsers" rows={browsers} />
                    <BreakdownSection title="Operating systems" rows={os} />
                    <BreakdownSection title="Referrers" rows={referrers} />
                  </>
                )
              ) : null}

              {analyticsQuery.isLoading ? (
                <LoadingState padded variant="analytics" message="Loading analytics..." />
              ) : null}
            </LazyColumn>
          </PullToRefreshBox>
        </Column>
      </Host>
    </ScreenShell>
  );
}
