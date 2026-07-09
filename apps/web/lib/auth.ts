import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { bearer, emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createDb } from "@xaply/db";
import * as schema from "@xaply/db/schema";
import { createAuthRateLimitStorage } from "./auth-rate-limit";
import { sendOtpEmail } from "./email";

export function createAuth(
  db: D1Database,
  env: Pick<
    CloudflareEnv,
    | "ZAP_CACHE"
    | "RESEND_API_KEY"
    | "GOOGLE_CLIENT_ID"
    | "GOOGLE_CLIENT_SECRET"
    | "GITHUB_CLIENT_ID"
    | "GITHUB_CLIENT_SECRET"
  >
) {
  return betterAuth({
    appName: "Xaply",
    database: drizzleAdapter(createDb(db), {
      provider: "sqlite",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    advanced: {
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
    },
    rateLimit: {
      enabled: process.env.NODE_ENV === "production",
      window: 60,
      max: 100,
      customStorage: createAuthRateLimitStorage(env.ZAP_CACHE),
      customRules: {
        "/get-session": false,
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,      // refresh if < 1 day remaining
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
    plugins: [
      bearer(),
      nextCookies(),
      emailOTP({
        otpLength: 6,
        expiresIn: 300, // 5 minutes
        allowedAttempts: 5,
        async sendVerificationOTP({ email, otp, type }) {
          await sendOtpEmail({
            to: email,
            otp,
            apiKey: env.RESEND_API_KEY,
            type: type === "forget-password" ? "forget-password" : "email-verification",
          });
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
