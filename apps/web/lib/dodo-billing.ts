import DodoPayments from "dodopayments";
import {
  checkout,
  dodopayments,
  portal,
  webhooks,
} from "@dodopayments/better-auth";
import {
  ensureUserWorkspace,
  isWorkspacePlan,
  readDodoCustomerMetadata,
  resolveUserIdForDodoCustomer,
  setWorkspacePlanByUserId,
  type WorkspacePlan,
} from "@xaply/db";

export const PRO_CHECKOUT_SLUG = "pro";
export const BUSINESS_CHECKOUT_SLUG = "business";

type BillingEnv = Pick<
  CloudflareEnv,
  | "DB"
  | "ZAP_CACHE"
  | "DODO_PAYMENTS_API_KEY"
  | "DODO_PAYMENTS_WEBHOOK_SECRET"
  | "DODO_PAYMENTS_ENVIRONMENT"
  | "DODO_PRO_PRODUCT_ID"
  | "DODO_BUSINESS_PRODUCT_ID"
>;

export function isDodoBillingConfigured(
  env: Pick<
    BillingEnv,
    "DODO_PAYMENTS_API_KEY" | "DODO_PAYMENTS_WEBHOOK_SECRET" | "DODO_PRO_PRODUCT_ID"
  >
): boolean {
  return Boolean(env.DODO_PAYMENTS_API_KEY && env.DODO_PRO_PRODUCT_ID);
}

export function isDodoBusinessConfigured(
  env: Pick<BillingEnv, "DODO_BUSINESS_PRODUCT_ID">
): boolean {
  return Boolean(env.DODO_BUSINESS_PRODUCT_ID);
}

function dodoEnvironment(env: BillingEnv): "test_mode" | "live_mode" {
  return env.DODO_PAYMENTS_ENVIRONMENT === "test_mode" ? "test_mode" : "live_mode";
}

function readDodoProductId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return undefined;
  const record = data as {
    product_id?: string;
    productId?: string;
    product?: { product_id?: string; id?: string };
  };
  return (
    record.product_id ??
    record.productId ??
    record.product?.product_id ??
    record.product?.id
  );
}

function planFromSubscriptionPayload(
  env: BillingEnv,
  payload: unknown,
  fallback: WorkspacePlan
): WorkspacePlan {
  const productId = readDodoProductId(payload);
  if (productId && env.DODO_BUSINESS_PRODUCT_ID && productId === env.DODO_BUSINESS_PRODUCT_ID) {
    return "business";
  }
  if (productId && productId === env.DODO_PRO_PRODUCT_ID) {
    return "pro";
  }
  return isWorkspacePlan(fallback) ? fallback : "pro";
}

async function handleSubscriptionPlanChange(
  env: BillingEnv,
  payload: unknown,
  plan: WorkspacePlan
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

  const resolvedPlan = plan === "free" ? "free" : planFromSubscriptionPayload(env, payload, plan);
  await setWorkspacePlanByUserId(env.DB, env.ZAP_CACHE, resolvedUserId, resolvedPlan);
}

export function createDodoPaymentsPlugin(env: BillingEnv) {
  if (!isDodoBillingConfigured(env)) return null;

  const client = new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: dodoEnvironment(env),
  });

  const products = [
    {
      productId: env.DODO_PRO_PRODUCT_ID,
      slug: PRO_CHECKOUT_SLUG,
    },
    ...(env.DODO_BUSINESS_PRODUCT_ID
      ? [{ productId: env.DODO_BUSINESS_PRODUCT_ID, slug: BUSINESS_CHECKOUT_SLUG }]
      : []),
  ];

  return dodopayments({
    client,
    createCustomerOnSignUp: true,
    getCustomerParams: (user) => ({
      metadata: { userId: user.id },
    }),
    use: [
      checkout({
        products,
        successUrl: "/dashboard?upgraded=1",
        authenticatedUsersOnly: true,
      }),
      portal(),
      ...(env.DODO_PAYMENTS_WEBHOOK_SECRET
        ? [
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
          ]
        : []),
    ],
  });
}

export async function ensureWorkspaceAfterSignUp(
  db: D1Database,
  user: { id: string; name: string }
): Promise<void> {
  await ensureUserWorkspace(db, user.id, user.name);
}
