import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import {
  createDb,
  SHORT_LINK_DOMAIN,
  hashLinkPassword,
  toPublicLink,
  toPublicLinks,
  validateClickLimit,
  validateDestinationUrl,
  validateExpiresAt,
  validateLinkPassword,
  validateOptionalDestinationUrl,
  validateSlug,
  validateTitle,
  assertCanAddActiveLink,
} from "@xaply/db";
import { links } from "@xaply/db/schema";
import { nanoid } from "nanoid";
import { isSession, requireSession } from "@/lib/api-auth";
import { withApiHandler } from "@/lib/api-handler";
import { parseLinksListParams } from "@/lib/filter-links";
import { queryLinksPage } from "@/lib/links-list-query";
import { API_READ_LIMIT, LINK_CREATE_LIMIT, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/links", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
      kv: env.ZAP_CACHE,
      key: `read:${session.user.id}`,
      ...API_READ_LIMIT,
    });
    if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

    const params = parseLinksListParams(request.nextUrl.searchParams);
    const db = createDb(env.DB);
    const result = await queryLinksPage(db, session.user.id, params);

    return NextResponse.json({
      ...result,
      links: toPublicLinks(result.links),
    });
  });
}

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  return withApiHandler(env, "/api/links", async () => {
    const session = await requireSession(request, env);
    if (!isSession(session)) return session;

    const rl = await rateLimit({
    kv: env.ZAP_CACHE,
    key: `create:${session.user.id}`,
    ...LINK_CREATE_LIMIT,
  });
  if (!rl.success) return rateLimitResponse(rl.retryAfter ?? 60);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    destinationUrl,
    slug,
    title,
    expiresAt,
    clickLimit,
    password,
    androidUrl,
    androidStoreUrl,
    iosUrl,
    iosStoreUrl,
  } = body as {
    destinationUrl?: unknown;
    slug?: unknown;
    title?: unknown;
    expiresAt?: unknown;
    clickLimit?: unknown;
    password?: unknown;
    androidUrl?: unknown;
    androidStoreUrl?: unknown;
    iosUrl?: unknown;
    iosStoreUrl?: unknown;
  };

  const urlResult = validateDestinationUrl(destinationUrl);
  if (!urlResult.ok) {
    return NextResponse.json({ error: urlResult.error }, { status: 400 });
  }

  const titleResult = validateTitle(title);
  if (!titleResult.ok) {
    return NextResponse.json({ error: titleResult.error }, { status: 400 });
  }

  const expiresAtResult = validateExpiresAt(expiresAt);
  if (!expiresAtResult.ok) {
    return NextResponse.json({ error: expiresAtResult.error }, { status: 400 });
  }

  const clickLimitResult = validateClickLimit(clickLimit);
  if (!clickLimitResult.ok) {
    return NextResponse.json({ error: clickLimitResult.error }, { status: 400 });
  }

  const passwordResult = validateLinkPassword(password);
  if (!passwordResult.ok) {
    return NextResponse.json({ error: passwordResult.error }, { status: 400 });
  }

  const androidUrlResult = validateOptionalDestinationUrl(androidUrl, "androidUrl");
  if (!androidUrlResult.ok) {
    return NextResponse.json({ error: androidUrlResult.error }, { status: 400 });
  }
  const androidStoreResult = validateOptionalDestinationUrl(
    androidStoreUrl,
    "androidStoreUrl"
  );
  if (!androidStoreResult.ok) {
    return NextResponse.json({ error: androidStoreResult.error }, { status: 400 });
  }
  const iosUrlResult = validateOptionalDestinationUrl(iosUrl, "iosUrl");
  if (!iosUrlResult.ok) {
    return NextResponse.json({ error: iosUrlResult.error }, { status: 400 });
  }
  const iosStoreResult = validateOptionalDestinationUrl(iosStoreUrl, "iosStoreUrl");
  if (!iosStoreResult.ok) {
    return NextResponse.json({ error: iosStoreResult.error }, { status: 400 });
  }

  let passwordHash: string | null = null;
  if (passwordResult.value) {
    passwordHash = await hashLinkPassword(passwordResult.value);
  }

  let finalSlug: string;
  if (slug === undefined || slug === null || slug === "") {
    finalSlug = nanoid(7);
  } else {
    const slugResult = validateSlug(slug);
    if (!slugResult.ok) {
      return NextResponse.json({ error: slugResult.error }, { status: 400 });
    }
    finalSlug = slugResult.value;
  }

  const db = createDb(env.DB);

  const activeLinkLimit = await assertCanAddActiveLink(env.DB, session.user.id);
  if (!activeLinkLimit.ok) {
    return NextResponse.json({ error: activeLinkLimit.error }, { status: 403 });
  }

  try {
    const [link] = await db
      .insert(links)
      .values({
        id: nanoid(),
        userId: session.user.id,
        slug: finalSlug,
        domain: SHORT_LINK_DOMAIN,
        destinationUrl: urlResult.value,
        title: titleResult.value || null,
        expiresAt: expiresAtResult.value,
        clickLimit: clickLimitResult.value,
        passwordHash,
        androidUrl: androidUrlResult.value,
        androidStoreUrl: androidStoreResult.value,
        iosUrl: iosUrlResult.value,
        iosStoreUrl: iosStoreResult.value,
        status: "active",
      })
      .returning();

    void env.ZAP_CACHE.put(finalSlug, JSON.stringify(link), { expirationTtl: 60 * 60 * 24 * 7 });

    return NextResponse.json({ link: toPublicLink(link) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }
  });
}
