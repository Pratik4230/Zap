import {
  getUsersNeedingStreakReminder,
  sendExpoPushHttp,
  logError,
  logEvent,
  utcDateString,
} from "@xaply/db";

interface StreakReminderEnv {
  DB: D1Database;
  ZAP_CACHE: KVNamespace;
}

interface ReminderThreshold {
  minHours: number;
  maxHours: number;
  label: number;
  title: string;
  body: string;
}

const REMINDER_THRESHOLDS: ReminderThreshold[] = [
  {
    minHours: 18,
    maxHours: 20,
    label: 18,
    title: "🔥 Keep your streak alive!",
    body: "You haven't opened Xaply today. Don't break your streak!",
  },
  {
    minHours: 20,
    maxHours: 22,
    label: 20,
    title: "⚠️ Your streak is at risk!",
    body: "Only a few hours left today. Open Xaply to keep your streak going.",
  },
  {
    minHours: 22,
    maxHours: 24,
    label: 22,
    title: "⏰ Last chance!",
    body: "Open Xaply now to save your streak before midnight UTC.",
  },
];

export async function runStreakReminderCron(env: StreakReminderEnv): Promise<void> {
  const today = utcDateString();

  for (const threshold of REMINDER_THRESHOLDS) {
    try {
      const users = await getUsersNeedingStreakReminder(
        env.DB,
        threshold.minHours,
        threshold.maxHours
      );

      for (const user of users) {
        const dedupKey = `streak-reminded:${user.userId}:${today}:${threshold.label}`;

        const alreadySent = await env.ZAP_CACHE.get(dedupKey);
        if (alreadySent) continue;

        try {
          await sendExpoPushHttp(
            user.tokens.map((token) => ({
              to: token,
              title: threshold.title,
              body: threshold.body,
              data: { href: "/streak" },
              sound: "default" as const,
            }))
          );

          await env.ZAP_CACHE.put(dedupKey, "1", { expirationTtl: 60 * 60 * 48 });

          logEvent({
            event: "streak.reminder_sent",
            userId: user.userId,
            threshold: threshold.label,
            tokens: user.tokens.length,
            worker: "xaply-analytics",
          });
        } catch (err) {
          logError("streak.reminder_push_failed", err, {
            userId: user.userId,
            threshold: threshold.label,
          });
        }
      }
    } catch (err) {
      logError("streak.reminder_cron_failed", err, {
        threshold: threshold.label,
        worker: "xaply-analytics",
      });
    }
  }
}
