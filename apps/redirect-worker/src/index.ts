import { getLinkFromCache, cacheLinkInKV } from "./kv";
import { getLinkBySlug } from "./db";
import { buildClickEvent } from "./analytics";

interface WorkerEnv {
  ZAP_CACHE: KVNamespace;
  DB: D1Database;
  ANALYTICS_QUEUE: Queue;
}

export default {
  async fetch(request, env: WorkerEnv, ctx): Promise<Response> {
    const url = new URL(request.url);
    const slug = url.pathname.slice(1);

    if (!slug) {
      return new Response("Zap", { status: 200 });
    }

    const domain = url.hostname;

    let link = await getLinkFromCache(env.ZAP_CACHE, slug);

    if (!link) {
      link = await getLinkBySlug(env.DB, slug, domain);

      if (!link) {
        return new Response("Link not found", { status: 404 });
      }

      ctx.waitUntil(cacheLinkInKV(env.ZAP_CACHE, slug, link));
    }

    ctx.waitUntil(env.ANALYTICS_QUEUE.send(buildClickEvent(link.id, request)));

    return Response.redirect(link.destinationUrl, 302);
  },
} satisfies ExportedHandler<WorkerEnv>;
