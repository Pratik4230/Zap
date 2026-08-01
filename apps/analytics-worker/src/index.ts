import {
  createDb,
  clicks,
  links,
  pushTokens,
  linkClickMilestoneNotifications,
  isLinkWithinClickLimit,
  milestonesCrossed,
  formatClickMilestone,
  sendExpoPushHttp,
  logError,
  logEvent,
} from "@xaply/db";
import type { ClickEvent } from "@xaply/db";
import { eq, sql } from "drizzle-orm";

interface WorkerEnv {
  DB: D1Database;
}

async function notifyClickMilestones(
  db: ReturnType<typeof createDb>,
  link: typeof links.$inferSelect,
  previousCount: number,
  newCount: number
): Promise<void> {
  const crossed = milestonesCrossed(previousCount, newCount);
  if (crossed.length === 0) return;

  const tokens = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, link.userId));

  if (tokens.length === 0) return;

  const label =
    link.title?.trim() || `${link.domain}/${link.slug}`;

  for (const milestone of crossed) {
    // Claim the milestone first — unique(linkId, milestone) dedupes races.
    const claimed = await db
      .insert(linkClickMilestoneNotifications)
      .values({
        id: crypto.randomUUID(),
        linkId: link.id,
        milestone,
        sentAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: linkClickMilestoneNotifications.id });

    if (claimed.length === 0) continue;

    const countLabel = formatClickMilestone(milestone);
    try {
      await sendExpoPushHttp(
        tokens.map((row) => ({
          to: row.token,
          title: "Click milestone",
          body: `${label} hit ${countLabel} clicks`,
          data: {
            href: `/links/${link.id}/analytics`,
            linkId: link.id,
            milestone,
          },
          sound: "default" as const,
        }))
      );
      logEvent({
        event: "push.milestone_sent",
        linkId: link.id,
        milestone,
        tokens: tokens.length,
        worker: "xaply-analytics",
      });
    } catch (error) {
      logError("push.milestone_send_failed", error, {
        linkId: link.id,
        milestone,
      });
    }
  }
}

export default {
  async queue(batch: MessageBatch<ClickEvent>, env: WorkerEnv): Promise<void> {
    const db = createDb(env.DB);

    for (const message of batch.messages) {
      const event = message.body;

      try {
        await db.batch([
          db.insert(clicks).values({
            id: crypto.randomUUID(),
            linkId: event.linkId,
            timestamp: new Date(event.timestamp),
            country: event.country ?? null,
            city: event.city ?? null,
            device: event.device ?? null,
            os: event.os ?? null,
            browser: event.browser ?? null,
            referrer: event.referrer ?? null,
          }),
          db
            .update(links)
            .set({
              clickCount: sql`${links.clickCount} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(links.id, event.linkId)),
        ]);

        const [link] = await db
          .select()
          .from(links)
          .where(eq(links.id, event.linkId))
          .limit(1);

        if (link) {
          const newCount = link.clickCount;
          const previousCount = Math.max(0, newCount - 1);

          if (link.clickLimit != null && !isLinkWithinClickLimit(link)) {
            await db
              .update(links)
              .set({ status: "expired", updatedAt: new Date() })
              .where(eq(links.id, event.linkId));
          }

          // Fire-and-forget style but awaited so errors are logged before ack.
          await notifyClickMilestones(db, link, previousCount, newCount);
        }

        message.ack();
      } catch (error) {
        logError("analytics.click_ingest_failed", error, {
          worker: "xaply-analytics",
          linkId: event.linkId,
          messageId: message.id,
        });
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<WorkerEnv, ClickEvent>;
