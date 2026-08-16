import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
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
  Row,
  Text,
  TextButton,
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
import {
  analyticsRangeOptions,
  clampAnalyticsRange,
} from "@/features/analytics/utils/range-options";
import { useWorkspace } from "@/features/workspace/use-workspace";
import { colors } from "@/global/theme";

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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <ListItem
      colors={{
        containerColor: colors.surface,
        contentColor: colors.foreground,
        supportingContentColor: colors.muted,
      }}
      modifiers={[weight(1)]}
    >
      <ListItem.HeadlineContent>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>{value}</Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Text style={{ fontSize: 12 }}>{label}</Text>
      </ListItem.SupportingContent>
    </ListItem>
  );
}

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
        rows.slice(0, 8).map((row) => (
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

export default function AnalyticsTabScreen() {
  const router = useRouter();
  const { current: workspace, usable: usableWorkspaces } = useWorkspace();
  const workspaceId = workspace?.workspaceId ?? "";
  const [rangeDays, setRangeDays] = useState<number>(30);
  const rangeOptions = analyticsRangeOptions(workspace?.plan);

  useEffect(() => {
    setRangeDays((days) => clampAnalyticsRange(days, workspace?.plan));
  }, [workspace?.plan]);

  const analyticsQuery = useQuery({
    queryKey: queryKeys.analytics.account(rangeDays, workspaceId),
    queryFn: () => apiClient.analytics.account(rangeDays),
    enabled: Boolean(workspaceId),
    placeholderData: (previous) => previous,
  });

  const analytics = analyticsQuery.data;

  const countryRows = useMemo(
    () =>
      (analytics?.countries ?? []).map((row) => ({
        label: row.country,
        count: row.count,
      })),
    [analytics?.countries]
  );

  const cityRows = useMemo(
    () =>
      (analytics?.cities ?? []).map((row: CountRow) => ({
        label: row.label,
        count: row.count,
      })),
    [analytics?.cities]
  );

  const deviceRows = useMemo(
    () =>
      (analytics?.devices ?? []).map((row: DeviceBreakdown) => ({
        label: row.device,
        count: row.count,
        suffix: ` (${Math.round(row.pct)}%)`,
      })),
    [analytics?.devices]
  );

  const countryPieItems = useMemo(
    () => countryRows.map((row) => ({ label: row.label, value: row.count })),
    [countryRows]
  );
  const devicePieItems = useMemo(
    () => deviceRows.map((row) => ({ label: row.label, value: row.count })),
    [deviceRows]
  );

  const subtitle = analytics
    ? `${workspace?.workspaceName ? `${workspace.workspaceName} · ` : ""}${analytics.rangeLabel} • ${analytics.totalClicks} total clicks`
    : workspace?.workspaceName
      ? `${workspace.workspaceName} · Workspace click stats`
      : "Workspace click stats";

  return (
    <ScreenShell>
      <Host colorScheme="dark" seedColor={colors.primary} style={{ flex: 1, width: "100%" }}>
        <Column modifiers={[fillMaxSize(), fillMaxWidth(), padding(14, 4, 14, 8)]} verticalArrangement={{ spacedBy: 10 }}>
          <Column verticalArrangement={{ spacedBy: 3 }} modifiers={[fillMaxWidth()]}>
            <Text color={colors.foreground} style={{ fontSize: 22, fontWeight: "700" }}>
              Analytics
            </Text>
            <Text color={colors.muted} style={{ fontSize: 13 }}>
              {subtitle}
            </Text>
            {usableWorkspaces.length > 1 ? (
              <TextButton
                contentPadding={{ start: 0, top: 4, end: 0, bottom: 0 }}
                onClick={() => router.navigate("/workspace")}
              >
                <Text color={colors.primary} style={{ fontSize: 13 }}>
                  Switch workspace
                </Text>
              </TextButton>
            ) : null}
          </Column>

          <FlowRow horizontalArrangement={{ spacedBy: 8 }} verticalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth()]}>
            {rangeOptions.map((option) => (
              <FilterChip
                key={option.days}
                selected={rangeDays === option.days}
                onClick={() => setRangeDays(option.days)}
                colors={{
                  selectedContainerColor: colors.primary,
                  selectedLabelColor: colors.primaryForeground,
                  labelColor: colors.muted,
                  containerColor: colors.surface,
                }}
              >
                <FilterChip.Label>
                  <Text>{option.label}</Text>
                </FilterChip.Label>
              </FilterChip>
            ))}
          </FlowRow>

          <PullToRefreshBox
            isRefreshing={analyticsQuery.isRefetching}
            onRefresh={() => void analyticsQuery.refetch()}
            contentAlignment="topCenter"
            indicator={{
              color: colors.primary,
              containerColor: colors.background,
            }}
            modifiers={[fillMaxWidth(), weight(1)]}
          >
            <LazyColumn verticalArrangement={{ spacedBy: 8 }} contentPadding={{ bottom: 18 }} modifiers={[fillMaxSize()]}>
              {analytics ? (
                <Row horizontalArrangement={{ spacedBy: 8 }} modifiers={[fillMaxWidth(), padding(14, 0, 14, 0)]}>
                  <MetricCard label="Total clicks" value={String(analytics.totalClicks)} />
                  <MetricCard label="Top links" value={String(analytics.topLinks.length)} />
                </Row>
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
                    description="Share a short link to start collecting analytics."
                  />
                ) : (
                  <>
                    <BreakdownSection
                      title="Top links"
                      rows={analytics.topLinks.map((link) => ({
                        label: link.title?.trim() || `${link.domain}/${link.slug}`,
                        count: link.clicks,
                      }))}
                    />
                    <PieSection title="Countries" items={countryPieItems} />
                    <BreakdownSection title="Cities" rows={cityRows} />
                    <PieSection title="Devices" items={devicePieItems} />
                  </>
                )
              ) : null}

              {analyticsQuery.isLoading ? (
                <LoadingState padded message="Loading analytics..." />
              ) : null}
            </LazyColumn>
          </PullToRefreshBox>
        </Column>
      </Host>
    </ScreenShell>
  );
}
