import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { APP_URL } from "@xaply/db";

function getAuthBaseURL() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? APP_URL;
}

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  plugins: [emailOTPClient()],
});

export type { Session } from "./auth";
