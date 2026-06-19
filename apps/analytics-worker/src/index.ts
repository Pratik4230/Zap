import { createDb, clicks, links } from "@zap/db";
import type { ClickEvent } from "@zap/db";
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

        message.ack();
      } catch {
        message.retry();
      }
    }
  },
} satisfies ExportedHandler<WorkerEnv, ClickEvent>;
