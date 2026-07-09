import {
  APP_URL,
  assertSafeRedirectUrl,
  isValidSlugPath,
  rateLimitKv,
  REDIRECT_IP_LIMIT,
} from "@xaply/db";
import { getLinkFromCache, cacheLinkInKV } from "./kv";
import { getLinkBySlug } from "./db";
import { buildClickEvent } from "./analytics";

interface WorkerEnv {
  ZAP_CACHE: KVNamespace;
  DB: D1Database;
  ANALYTICS_QUEUE: Queue;
}

function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

function isLinkActive(link: {
  status: string;
  expiresAt: Date | string | null;
}): boolean {
  if (link.status !== "active") return false;
  if (!link.expiresAt) return true;
  const expiresAt = link.expiresAt instanceof Date ? link.expiresAt : new Date(link.expiresAt);
  return expiresAt > new Date();
}

export default {
  async fetch(request, env: WorkerEnv, ctx): Promise<Response> {
    const url = new URL(request.url);
    const slug = url.pathname.slice(1).split("/")[0] ?? "";

    if (!slug) {
      return Response.redirect(APP_URL, 302);
    }

    if (!isValidSlugPath(slug)) {
      return new Response("Not found", { status: 404 });
    }

    const ip = getClientIp(request);
    const rl = await rateLimitKv(
      env.ZAP_CACHE,
      `redirect:${ip}`,
      REDIRECT_IP_LIMIT.limit,
      REDIRECT_IP_LIMIT.windowSeconds
    );
    if (!rl.success) {
      return new Response("Too many requests", {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfter ?? 60) },
      });
    }

    const domain = url.hostname;

    let link = await getLinkFromCache(env.ZAP_CACHE, slug);

    if (!link) {
      link = await getLinkBySlug(env.DB, slug, domain);

      if (!link) {
        return new Response("Link not found", { status: 404 });
      }

      ctx.waitUntil(cacheLinkInKV(env.ZAP_CACHE, slug, link));
    } else if (!isLinkActive(link)) {
      return new Response("Link not found", { status: 404 });
    }

    if (!assertSafeRedirectUrl(link.destinationUrl)) {
      return new Response("Invalid destination", { status: 410 });
    }

    ctx.waitUntil(env.ANALYTICS_QUEUE.send(buildClickEvent(link.id, request)));

    return Response.redirect(link.destinationUrl, 302);
  },
} satisfies ExportedHandler<WorkerEnv>;
