import { createAuthMiddleware } from "better-auth/api";
import { HIDE_METADATA } from "better-auth";
import { APIError, createAuthEndpoint } from "better-auth/api";
import * as z from "zod";

const GOOGLE_AUTH_HOST = "accounts.google.com";

function decodeAuthorizationUrl(encoded: string): string | null {
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Mobile OAuth bridge for Expo Custom Tabs.
 *
 * `expo-authorization-proxy` passes `authorizationURL` in a GET query string,
 * which truncates at `&` and drops `redirect_uri` on Google.
 * This endpoint accepts a base64url-encoded URL and sets the signed `state`
 * cookie before redirecting to Google.
 */
/**
 * After bearer() runs, append the session token to mobile OAuth deep links.
 * Cookies in the URL can be truncated on Android; the bearer token is short and
 * reliable for `get-session` on React Native.
 */
export function mobileOAuthRedirectPlugin() {
  return {
    id: "xaply-mobile-oauth-redirect",
    hooks: {
      after: [
        {
          matcher(context: { path?: string }) {
            return !!context.path?.startsWith("/callback");
          },
          handler: createAuthMiddleware(async (ctx) => {
            const location = ctx.context.responseHeaders?.get("location");
            if (!location) return;

            let redirectURL: URL;
            try {
              redirectURL = new URL(location);
            } catch {
              return;
            }

            if (
              redirectURL.protocol === "http:" ||
              redirectURL.protocol === "https:"
            ) {
              return;
            }

            if (!ctx.context.isTrustedOrigin(location)) return;

            const token = ctx.context.responseHeaders?.get("set-auth-token");
            if (!token) return;

            redirectURL.searchParams.set("token", token);
            ctx.setHeader("location", redirectURL.toString());
          }),
        },
      ],
    },
  };
}

export function mobileOAuthPlugin() {
  return {
    id: "xaply-mobile-oauth",
    endpoints: {
      mobileOauthStart: createAuthEndpoint(
        "/mobile-oauth-start",
        {
          method: "GET",
          query: z.object({
            u: z.string().min(1),
          }),
          metadata: HIDE_METADATA,
        },
        async (ctx) => {
          const authorizationURL = decodeAuthorizationUrl(ctx.query.u);
          if (!authorizationURL) {
            throw new APIError("BAD_REQUEST", {
              message: "Invalid authorization URL encoding.",
            });
          }

          let url: URL;
          try {
            url = new URL(authorizationURL);
          } catch {
            throw new APIError("BAD_REQUEST", {
              message: "Invalid authorization URL.",
            });
          }

          if (url.protocol !== "https:" || url.hostname !== GOOGLE_AUTH_HOST) {
            throw new APIError("BAD_REQUEST", {
              message: "Invalid authorization URL host.",
            });
          }

          if (!url.searchParams.get("redirect_uri")) {
            throw new APIError("BAD_REQUEST", {
              message: "Authorization URL is missing redirect_uri.",
            });
          }

          const state = url.searchParams.get("state");
          if (!state) {
            throw new APIError("BAD_REQUEST", {
              message: "Authorization URL is missing state.",
            });
          }

          const stateCookie = ctx.context.createAuthCookie("state", {
            maxAge: 300,
          });
          await ctx.setSignedCookie(
            stateCookie.name,
            state,
            ctx.context.secret,
            stateCookie.attributes,
          );

          throw ctx.redirect(authorizationURL);
        },
      ),
    },
  };
}
