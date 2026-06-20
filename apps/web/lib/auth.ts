import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { bearer } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createDb } from "@zap/db";
import * as schema from "@zap/db/schema";

export function createAuth(db: D1Database) {
  return betterAuth({
    appName: "Zap",
    database: drizzleAdapter(createDb(db), {
      provider: "sqlite",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url }) => {
        console.log(`[DEV] Password reset for ${user.email}: ${url}`);
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        console.log(`[DEV] Verify email for ${user.email}: ${url}`);
      },
      sendOnSignUp: true,
    },
    plugins: [
      bearer(),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
