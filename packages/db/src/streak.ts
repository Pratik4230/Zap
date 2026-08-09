import { and, desc, eq, gte, lt, isNotNull } from "drizzle-orm";
import { createDb } from "./db";
import { users, workspaces, streakDays, streakRewards, pushTokens } from "./schema";
import { userPlanCacheKey } from "./plan-limits";

export const STREAK_REQUIRED_DAYS = 21;
export const STREAK_PRO_GRANT_DAYS = 365;

export function utcDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function utcYesterdayString(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return utcDateString(d);
}

export async function recordStreakDay(
  db: D1Database,
  userId: string
): Promise<{ streak: number; isNew: boolean }> {
  const drizzle = createDb(db);
  const today = utcDateString();

  const inserted = await drizzle
    .insert(streakDays)
    .values({ id: crypto.randomUUID(), userId, date: today })
    .onConflictDoNothing()
    .returning({ id: streakDays.id });

  const isNew = inserted.length > 0;

  if (isNew) {
    await drizzle
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, userId));
  }

  const streak = await getCurrentStreak(db, userId);
  return { streak, isNew };
}

export async function getCurrentStreak(
  db: D1Database,
  userId: string
): Promise<number> {
  const drizzle = createDb(db);

  const rows = await drizzle
    .select({ date: streakDays.date })
    .from(streakDays)
    .where(eq(streakDays.userId, userId))
    .orderBy(desc(streakDays.date))
    .limit(25);

  if (rows.length === 0) return 0;

  const today = utcDateString();
  const yesterday = utcYesterdayString();

  const mostRecent = rows[0]!.date;
  if (mostRecent !== today && mostRecent !== yesterday) return 0;

  let streak = 0;
  let expected = mostRecent;

  for (const row of rows) {
    if (row.date === expected) {
      streak++;
      const d = new Date(expected + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() - 1);
      expected = utcDateString(d);
    } else {
      break;
    }
  }

  return streak;
}

export async function hasClaimedStreakReward(
  db: D1Database,
  userId: string
): Promise<boolean> {
  const drizzle = createDb(db);
  const [row] = await drizzle
    .select({ id: streakRewards.id })
    .from(streakRewards)
    .where(eq(streakRewards.userId, userId))
    .limit(1);
  return Boolean(row);
}

export type ClaimResult =
  | { ok: true; proGrantedUntil: Date }
  | { ok: false; error: string };

export async function claimStreakReward(
  db: D1Database,
  kv: KVNamespace,
  userId: string
): Promise<ClaimResult> {
  const drizzle = createDb(db);

  const alreadyClaimed = await hasClaimedStreakReward(db, userId);
  if (alreadyClaimed) {
    return { ok: false, error: "Streak reward already claimed." };
  }

  const streak = await getCurrentStreak(db, userId);
  if (streak < STREAK_REQUIRED_DAYS) {
    return {
      ok: false,
      error: `Need ${STREAK_REQUIRED_DAYS} consecutive days. You have ${streak}.`,
    };
  }

  const proGrantedUntil = new Date();
  proGrantedUntil.setUTCDate(proGrantedUntil.getUTCDate() + STREAK_PRO_GRANT_DAYS);

  await drizzle.batch([
    drizzle.insert(streakRewards).values({
      id: crypto.randomUUID(),
      userId,
      proGrantedUntil,
    }),
    drizzle
      .update(workspaces)
      .set({ proGrantedUntil, updatedAt: new Date() })
      .where(eq(workspaces.ownerId, userId)),
  ]);

  await kv.delete(userPlanCacheKey(userId));

  return { ok: true, proGrantedUntil };
}

export interface StreakStatus {
  streak: number;
  hasClaimedReward: boolean;
  canClaim: boolean;
  proGrantedUntil: Date | null;
}

export async function getStreakStatus(
  db: D1Database,
  userId: string
): Promise<StreakStatus> {
  const drizzle = createDb(db);

  const [streak, rewardRow] = await Promise.all([
    getCurrentStreak(db, userId),
    drizzle
      .select({ proGrantedUntil: streakRewards.proGrantedUntil })
      .from(streakRewards)
      .where(eq(streakRewards.userId, userId))
      .limit(1),
  ]);

  const hasClaimedReward = rewardRow.length > 0;
  const proGrantedUntil = rewardRow[0]?.proGrantedUntil ?? null;
  const canClaim = streak >= STREAK_REQUIRED_DAYS && !hasClaimedReward;

  return { streak, hasClaimedReward, canClaim, proGrantedUntil };
}

export interface UserNeedingReminder {
  userId: string;
  lastActiveAt: Date;
  tokens: string[];
}

export async function getUsersNeedingStreakReminder(
  db: D1Database,
  minHours: number,
  maxHours: number
): Promise<UserNeedingReminder[]> {
  const drizzle = createDb(db);
  const now = new Date();
  const minCutoff = new Date(now.getTime() - maxHours * 60 * 60 * 1000);
  const maxCutoff = new Date(now.getTime() - minHours * 60 * 60 * 1000);
  const yesterday = utcYesterdayString();
  const today = utcDateString();

  const atRiskUsers = await drizzle
    .select({ userId: users.id, lastActiveAt: users.lastActiveAt })
    .from(users)
    .where(
      and(
        isNotNull(users.lastActiveAt),
        gte(users.lastActiveAt, minCutoff),
        lt(users.lastActiveAt, maxCutoff)
      )
    );

  if (atRiskUsers.length === 0) return [];

  const results: UserNeedingReminder[] = [];

  for (const user of atRiskUsers) {
    if (!user.lastActiveAt) continue;

    const [hadYesterday] = await drizzle
      .select({ id: streakDays.id })
      .from(streakDays)
      .where(
        and(eq(streakDays.userId, user.userId), eq(streakDays.date, yesterday))
      )
      .limit(1);
    if (!hadYesterday) continue;

    const [pinnedToday] = await drizzle
      .select({ id: streakDays.id })
      .from(streakDays)
      .where(
        and(eq(streakDays.userId, user.userId), eq(streakDays.date, today))
      )
      .limit(1);
    if (pinnedToday) continue;

    const tokenRows = await drizzle
      .select({ token: pushTokens.token })
      .from(pushTokens)
      .where(eq(pushTokens.userId, user.userId));
    if (tokenRows.length === 0) continue;

    results.push({
      userId: user.userId,
      lastActiveAt: user.lastActiveAt,
      tokens: tokenRows.map((r) => r.token),
    });
  }

  return results;
}
