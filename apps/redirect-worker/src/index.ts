import {
  APP_URL,
  assertSafeRedirectUrl,
  isLinkRedirectAllowed,
  isValidSlugPath,
  rateLimitKv,
  REDIRECT_IP_LIMIT,
  REDIRECT_PASSWORD_GUESS_LIMIT,
  verifyLinkPassword,
} from "@xaply/db";
import { getLinkFromCache, cacheLinkInKV } from "./kv";
import { getLinkBySlug, markLinkExpired, shouldExpireForClickLimit } from "./db";
import { buildClickEvent } from "./analytics";
import {
  createUnlockCookie,
  isUnlockCookieValid,
  renderPasswordPage,
} from "./password-page";
import { runExpireLinksCron } from "./expire-cron";

interface WorkerEnv {
  ZAP_CACHE: KVNamespace;
  DB: D1Database;
  ANALYTICS_QUEUE: Queue;
  LINK_PASSWORD_SECRET: string;
}

function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? "unknown";
}

function linkUnavailableResponse(reason: "expired" | "limit"): Response {
  const message =
    reason === "limit"
      ? "This link has reached its click limit."
      : "This link has expired.";
  return new Response(message, { status: 410 });
}

async function issueRedirect(
  request: Request,
  env: WorkerEnv,
  ctx: ExecutionContext,
  link: NonNullable<Awaited<ReturnType<typeof getLinkBySlug>>>
): Promise<Response> {
  if (!assertSafeRedirectUrl(link.destinationUrl)) {
    return new Response("Invalid destination", { status: 410 });
  }

  ctx.waitUntil(
    env.ANALYTICS_QUEUE.send(
      buildClickEvent(link.id, request as Request<unknown, IncomingRequestCfProperties>)
    )
  );
  return Response.redirect(link.destinationUrl, 302);
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
    }

    if (!isLinkRedirectAllowed(link)) {
      const reason = shouldExpireForClickLimit(link) ? "limit" : "expired";
      ctx.waitUntil(
        Promise.all([
          markLinkExpired(env.DB, link.id),
          env.ZAP_CACHE.delete(slug),
        ])
      );
      return linkUnavailableResponse(reason);
    }

    if (link.passwordHash) {
      if (request.method === "POST") {
        const guessRl = await rateLimitKv(
          env.ZAP_CACHE,
          `pwd:${ip}:${slug}`,
          REDIRECT_PASSWORD_GUESS_LIMIT.limit,
          REDIRECT_PASSWORD_GUESS_LIMIT.windowSeconds
        );
        if (!guessRl.success) {
          return renderPasswordPage({
            slug,
            title: link.title,
            error: "Too many attempts. Please wait and try again.",
          });
        }

        let password = "";
        const contentType = request.headers.get("content-type") ?? "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
          const form = await request.formData();
          const value = form.get("password");
          password = typeof value === "string" ? value : "";
        } else {
          return new Response("Unsupported content type", { status: 415 });
        }

        const valid = await verifyLinkPassword(password, link.passwordHash);
        if (!valid) {
          return renderPasswordPage({
            slug,
            title: link.title,
            error: "Incorrect password. Try again.",
          });
        }

        const cookie = await createUnlockCookie(
          link.id,
          slug,
          env.LINK_PASSWORD_SECRET,
          url.protocol === "https:"
        );
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/${slug}`,
            "Set-Cookie": cookie,
            "Cache-Control": "no-store",
          },
        });
      }

      if (request.method !== "GET") {
        return new Response("Method not allowed", { status: 405 });
      }

      const unlocked = await isUnlockCookieValid(request, link.id, env.LINK_PASSWORD_SECRET);
      if (!unlocked) {
        return renderPasswordPage({ slug, title: link.title });
      }
    } else if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    return issueRedirect(request, env, ctx, link);
  },

  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(runExpireLinksCron(env));
  },
} satisfies ExportedHandler<WorkerEnv>;
