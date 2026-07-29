import { createAuthClient } from "better-auth/react";
import { dodopaymentsClient } from "@dodopayments/better-auth/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { APP_URL } from "@xaply/db";

function getAuthBaseURL() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? APP_URL;
}

export function formatAuthRateLimitMessage(message: string, retryAfter?: string | null) {
  if (retryAfter && Number(retryAfter) > 0) {
    return `${message} Try again in ${retryAfter} seconds.`;
  }
  return message;
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [emailOTPClient(), dodopaymentsClient()],
  fetchOptions: {
    onError: (ctx) => {
      if (ctx.response.status !== 429) return;
      const retryAfter = ctx.response.headers.get("X-Retry-After");
      ctx.error = {
        ...ctx.error,
        message: formatAuthRateLimitMessage(
          ctx.error.message ?? "Too many requests. Please try again later.",
          retryAfter
        ),
      };
    },
  },
});

/** Clears the session and hard-navigates so middleware sees fresh cookies. */
export async function signOutAndRedirect(redirectTo = "/sign-in"): Promise<void> {
  const { error } = await authClient.signOut();
  if (error) {
    throw new Error(error.message ?? "Failed to sign out");
  }

  window.location.assign(redirectTo);
}

export type { Session } from "./auth";
