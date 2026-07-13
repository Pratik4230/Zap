import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { bearer, emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createDb } from "@xaply/db";
import * as schema from "@xaply/db/schema";
import { createAuthRateLimitStorage } from "./auth-rate-limit";
import {
  createDodoPaymentsPlugin,
  ensureWorkspaceAfterSignUp,
  isDodoBillingConfigured,
} from "./dodo-billing";
import { sendOtpEmail } from "./email";

export type AuthEnv = Pick<
  CloudflareEnv,
  | "ZAP_CACHE"
  | "RESEND_API_KEY"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"
  | "GITHUB_CLIENT_ID"
  | "GITHUB_CLIENT_SECRET"
  | "DODO_PAYMENTS_API_KEY"
  | "DODO_PAYMENTS_WEBHOOK_SECRET"
  | "DODO_PAYMENTS_ENVIRONMENT"
  | "DODO_PRO_PRODUCT_ID"
> & { DB: D1Database };

export function createAuth(db: D1Database, env: Omit<AuthEnv, "DB">) {
  const dodoPlugin = createDodoPaymentsPlugin({ ...env, DB: db });

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
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await ensureWorkspaceAfterSignUp(db, user);
          },
        },
      },
    },
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
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
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
      emailOTP({
        otpLength: 6,
        expiresIn: 300,
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
      ...(dodoPlugin ? [dodoPlugin] : []),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];

let cachedAuth: { auth: Auth; key: string } | undefined;

export function getAuth(env: AuthEnv) {
  const key = [
    env.DODO_PRO_PRODUCT_ID,
    env.DODO_PAYMENTS_ENVIRONMENT,
    isDodoBillingConfigured(env) ? "dodo" : "no-dodo",
  ].join(":");

  if (!cachedAuth || cachedAuth.key !== key) {
    cachedAuth = { auth: createAuth(env.DB, env), key };
  }

  return cachedAuth.auth;
}
