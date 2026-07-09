import { createDb, clicks, links, isLinkWithinClickLimit } from "@xaply/db";
import type { ClickEvent } from "@xaply/db";
import { eq, sql } from "drizzle-orm";

interface WorkerEnv {
  DB: D1Database;
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
          db.update(links)
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

        if (link && link.clickLimit != null && !isLinkWithinClickLimit(link)) {
          await db
            .update(links)
            .set({ status: "expired", updatedAt: new Date() })
            .where(eq(links.id, event.linkId));
        }

        message.ack();
      } catch {
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<WorkerEnv, ClickEvent>;
