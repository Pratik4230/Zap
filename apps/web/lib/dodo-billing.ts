import DodoPayments from "dodopayments";
import {
  checkout,
  dodopayments,
  portal,
  webhooks,
} from "@dodopayments/better-auth";
import {
  ensureUserWorkspace,
  readDodoCustomerMetadata,
  resolveUserIdForDodoCustomer,
  setWorkspacePlanByUserId,
} from "@xaply/db";

export const PRO_CHECKOUT_SLUG = "pro";

type BillingEnv = Pick<
  CloudflareEnv,
  | "DB"
  | "ZAP_CACHE"
  | "DODO_PAYMENTS_API_KEY"
  | "DODO_PAYMENTS_WEBHOOK_SECRET"
  | "DODO_PAYMENTS_ENVIRONMENT"
  | "DODO_PRO_PRODUCT_ID"
>;

export function isDodoBillingConfigured(
  env: Pick<BillingEnv, "DODO_PAYMENTS_API_KEY" | "DODO_PAYMENTS_WEBHOOK_SECRET" | "DODO_PRO_PRODUCT_ID">
): boolean {
  return Boolean(
    env.DODO_PAYMENTS_API_KEY &&
      env.DODO_PAYMENTS_WEBHOOK_SECRET &&
      env.DODO_PRO_PRODUCT_ID
  );
}

function dodoEnvironment(env: BillingEnv): "test_mode" | "live_mode" {
  return env.DODO_PAYMENTS_ENVIRONMENT === "test_mode" ? "test_mode" : "live_mode";
}

async function handleSubscriptionPlanChange(
  env: BillingEnv,
  payload: unknown,
  plan: "free" | "pro"
): Promise<void> {
  const { userId, dodoCustomerId } = readDodoCustomerMetadata(payload);
  const resolvedUserId = await resolveUserIdForDodoCustomer(
    env.DB,
    userId,
    dodoCustomerId
  );
  if (!resolvedUserId) {
    const eventType =
      payload && typeof payload === "object" && "event_type" in payload
        ? String((payload as { event_type: unknown }).event_type)
        : "unknown";
    console.warn("[billing] webhook user not resolved", eventType);
    return;
  }

  await setWorkspacePlanByUserId(env.DB, env.ZAP_CACHE, resolvedUserId, plan);
}

export function createDodoPaymentsPlugin(env: BillingEnv) {
  if (!isDodoBillingConfigured(env)) return null;

  const client = new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: dodoEnvironment(env),
  });

  return dodopayments({
    client,
    createCustomerOnSignUp: true,
    getCustomerParams: (user) => ({
      metadata: { userId: user.id },
    }),
    use: [
      checkout({
        products: [
          {
            productId: env.DODO_PRO_PRODUCT_ID,
            slug: PRO_CHECKOUT_SLUG,
          },
        ],
        successUrl: "/dashboard?upgraded=1",
        authenticatedUsersOnly: true,
      }),
      portal(),
      webhooks({
        webhookKey: env.DODO_PAYMENTS_WEBHOOK_SECRET,
        onSubscriptionActive: (payload) =>
          handleSubscriptionPlanChange(env, payload, "pro"),
        onSubscriptionRenewed: (payload) =>
          handleSubscriptionPlanChange(env, payload, "pro"),
        onSubscriptionCancelled: (payload) =>
          handleSubscriptionPlanChange(env, payload, "free"),
        onSubscriptionExpired: (payload) =>
          handleSubscriptionPlanChange(env, payload, "free"),
        onSubscriptionFailed: (payload) =>
          handleSubscriptionPlanChange(env, payload, "free"),
      }),
    ],
  });
}

export async function ensureWorkspaceAfterSignUp(
  db: D1Database,
  user: { id: string; name: string }
): Promise<void> {
  await ensureUserWorkspace(db, user.id, user.name);
}
