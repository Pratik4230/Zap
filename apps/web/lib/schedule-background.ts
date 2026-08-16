import { getCloudflareContext } from "@opennextjs/cloudflare";

export function scheduleBackground(task: Promise<unknown>): void {
  try {
    const { ctx } = getCloudflareContext();
    if (ctx && typeof ctx.waitUntil === "function") {
      ctx.waitUntil(task);
      return;
    }
  } catch {
    // Cloudflare context is unavailable outside the worker runtime.
  }
  void task.catch(() => undefined);
}
