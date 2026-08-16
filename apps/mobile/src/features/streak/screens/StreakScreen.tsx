import React, { useCallback } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/global/theme";
import { useStreakStatus, useClaimStreakReward } from "../hooks/use-streak";

const STREAK_REQUIRED = 21;

function FlameBar({ streak }: { streak: number }) {
  return (
    <View style={styles.flameGrid}>
      {Array.from({ length: STREAK_REQUIRED }).map((_, i) => {
        const filled = i < streak;
        return (
          <View
            key={i}
            style={[styles.flameDot, filled ? styles.flameDotActive : styles.flameDotEmpty]}
          >
            <Text style={styles.flameEmoji}>{filled ? "🔥" : "○"}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function StreakScreen() {
  const { data, isLoading, refetch } = useStreakStatus();
  const claimMutation = useClaimStreakReward();

  const handleClaim = useCallback(() => {
    Alert.alert(
      "Claim your free Pro year! 🎉",
      "You'll get Pro features for 1 full year — no credit card needed. This is a one-time reward.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Claim Now",
          onPress: () => {
            claimMutation.mutate(undefined, {
              onSuccess: (res) => {
                const until = new Date(res.proGrantedUntil).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
                Alert.alert("🎉 Pro Unlocked!", `You have Pro access until ${until}.`);
              },
              onError: () => {
                Alert.alert("Claim failed", "Please try again later.");
              },
            });
          },
        },
      ]
    );
  }, [claimMutation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const streak = data?.streak ?? 0;
  const canClaim = data?.canClaim ?? false;
  const hasClaimedReward = data?.hasClaimedReward ?? false;
  const proGrantedUntil = data?.proGrantedUntil
    ? new Date(data.proGrantedUntil).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const daysLeft = Math.max(0, STREAK_REQUIRED - streak);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.titleEmoji}>🔥</Text>
          <Text style={styles.title}>Streak Reward</Text>
          <Text style={styles.subtitle}>
            Stay active for 21 days and earn{"\n"}
            <Text style={styles.highlight}>1 year of Pro — for free</Text>
          </Text>
        </View>

        <View style={styles.countCard}>
          <Text style={styles.countNumber}>{streak}</Text>
          <Text style={styles.countLabel}>
            {streak === 1 ? "day" : "days"} in a row
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            {hasClaimedReward
              ? "Completed ✅"
              : canClaim
              ? "Ready to claim! 🎉"
              : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} to go`}
          </Text>
          <FlameBar streak={streak} />
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Day 1</Text>
            <Text style={styles.progressText}>Day 21</Text>
          </View>
        </View>

        {hasClaimedReward && proGrantedUntil && (
          <View style={styles.rewardCard}>
            <Text style={styles.rewardEmoji}>🎉</Text>
            <Text style={styles.rewardTitle}>Pro Unlocked!</Text>
            <Text style={styles.rewardBody}>Your free Pro access runs until</Text>
            <Text style={styles.rewardDate}>{proGrantedUntil}</Text>
          </View>
        )}

        {canClaim && !hasClaimedReward && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={handleClaim}
            disabled={claimMutation.isPending}
            activeOpacity={0.85}
          >
            {claimMutation.isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.claimButtonText}>Claim your free Pro year →</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How it works</Text>
          {[
            "Open Xaply on your phone each day",
            "Keep going for 21 days straight",
            "Tap Claim to unlock Pro for 1 year",
            "Miss a day — streak resets to zero",
            "One-time reward per account",
          ].map((item, i) => (
            <View key={i} style={styles.howRow}>
              <Text style={styles.howBullet}>•</Text>
              <Text style={styles.howItem}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: 12,
    gap: 8,
  },
  titleEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  highlight: {
    color: colors.primary,
    fontWeight: "600",
  },
  countCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  countNumber: {
    fontSize: 64,
    fontWeight: "800",
    color: colors.primary,
    lineHeight: 72,
  },
  countLabel: {
    fontSize: 16,
    color: colors.muted,
    marginTop: 4,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  flameGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  flameDot: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  flameDotActive: {
    backgroundColor: "rgba(254,154,0,0.15)",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.4)",
  },
  flameDotEmpty: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  flameEmoji: {
    fontSize: 16,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressText: {
    fontSize: 12,
    color: colors.muted,
  },
  rewardCard: {
    backgroundColor: "rgba(254,154,0,0.08)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(254,154,0,0.25)",
    gap: 6,
  },
  rewardEmoji: {
    fontSize: 36,
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },
  rewardBody: {
    fontSize: 14,
    color: colors.muted,
  },
  rewardDate: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
  claimButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  claimButtonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: "700",
  },
  howCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  howTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  howRow: {
    flexDirection: "row",
    gap: 8,
  },
  howBullet: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 20,
  },
  howItem: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
