import { useRef } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/global/theme";

const BOLT_PATH = "M 13 2 L 3 14 L 10 14 L 9 22 L 19 10 L 12 10 L 13 2 Z";

/** One shared pulse — no useEffect, starts once on first render. */
function usePulse(min = 0.35, max = 1) {
  const started = useRef(false);
  const opacity = useSharedValue(min);

  if (!started.current) {
    started.current = true;
    opacity.value = withRepeat(withTiming(max, { duration: 900 }), -1, true);
  }

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

function ShimmerBar({
  width,
  height = 12,
  style,
}: {
  width: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.bar,
        { width, height, borderRadius: height / 2 },
        style,
      ]}
      accessibilityElementsHidden
    />
  );
}

function BoltIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill={colors.primary} d={BOLT_PATH} />
    </Svg>
  );
}

export function BoltSpinner({
  size = 22,
  style,
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = usePulse();

  return (
    <Animated.View style={[styles.spinner, pulse, style]} accessibilityRole="progressbar">
      <BoltIcon size={size} />
    </Animated.View>
  );
}

export function BoltLinkRowSkeleton({ index = 0 }: { index?: number }) {
  const widths = ["58%", "42%", "36%"] as const;
  const w = widths[index % widths.length];

  return (
    <View style={styles.linkRow} accessibilityElementsHidden>
      <View style={styles.linkRowMain}>
        <ShimmerBar width={w} height={14} />
        <ShimmerBar width="36%" height={10} />
      </View>
      {index % 2 === 0 ? <ShimmerBar width={28} height={12} /> : null}
    </View>
  );
}

export function BoltLinkListSkeleton({ rows = 4 }: { rows?: number }) {
  const pulse = usePulse(0.45, 0.95);

  return (
    <Animated.View style={[styles.listBlock, pulse]}>
      {Array.from({ length: rows }).map((_, index) => (
        <BoltLinkRowSkeleton key={index} index={index} />
      ))}
    </Animated.View>
  );
}

export function BoltRankedListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.listBlock}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.rankedRow} accessibilityElementsHidden>
          <View style={styles.rankedHeader}>
            <ShimmerBar width="52%" height={12} />
            <ShimmerBar width={28} height={12} />
          </View>
          <ShimmerBar width="100%" height={4} />
        </View>
      ))}
    </View>
  );
}

export function BoltChartBarsSkeleton({ bars = 7 }: { bars?: number }) {
  const heights = [32, 48, 40, 56, 44, 36, 52];

  return (
    <View style={styles.chartRow} accessibilityElementsHidden>
      {heights.slice(0, bars).map((h, index) => (
        <View key={index} style={styles.chartCol}>
          <View style={[styles.chartBar, { flex: h }]} />
          <ShimmerBar width={20} height={8} />
        </View>
      ))}
    </View>
  );
}

export function BoltDeviceRingsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.ringsRow} accessibilityElementsHidden>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.ringCol}>
          <View style={styles.ring} />
          <ShimmerBar width={48} height={10} />
        </View>
      ))}
    </View>
  );
}

export function BoltAnalyticsSkeleton() {
  const pulse = usePulse(0.45, 0.95);

  return (
    <Animated.View style={[styles.analyticsBlock, pulse]}>
      <View style={styles.metricsRow}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.metricCard}>
            <ShimmerBar width="70%" height={18} />
            <ShimmerBar width="50%" height={10} style={styles.metricLabel} />
          </View>
        ))}
      </View>
      <BoltChartBarsSkeleton bars={7} />
      <BoltRankedListSkeleton rows={3} />
      <BoltDeviceRingsSkeleton count={3} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  spinner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  listBlock: {
    gap: 10,
    width: "100%",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  linkRowMain: {
    flex: 1,
    gap: 8,
  },
  rankedRow: {
    gap: 8,
    paddingVertical: 2,
  },
  rankedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 120,
    paddingVertical: 4,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    height: "100%",
  },
  chartBar: {
    width: "100%",
    minHeight: 20,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  ringsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
    paddingVertical: 4,
  },
  ringCol: {
    alignItems: "center",
    gap: 8,
  },
  ring: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  analyticsBlock: {
    gap: 16,
    width: "100%",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
    justifyContent: "center",
    gap: 8,
  },
  metricLabel: {
    marginTop: 2,
  },
});
