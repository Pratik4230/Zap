import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";
import { createAuth } from "@/lib/auth";
import { createDb, SHORT_LINK_DOMAIN } from "@xaply/db";
import { links } from "@xaply/db/schema";
import { eq,  desc } from "drizzle-orm";
import { nanoid } from "nanoid";

async function getSession(request: NextRequest, env: CloudflareEnv) {
  const auth = createAuth(env.DB, env);
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

export async function GET(request: NextRequest) {
  const { env } = getCloudflareContext();
  const session = await getSession(request, env);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createDb(env.DB);
  const userLinks = await db
    .select()
    .from(links)
    .where(eq(links.userId, session.user.id))
    .orderBy(desc(links.createdAt));

  return NextResponse.json({ links: userLinks });
}

export async function POST(request: NextRequest) {
  const { env } = getCloudflareContext();
  const session = await getSession(request, env);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { destinationUrl: string; slug?: string; title?: string };
  const { destinationUrl, slug, title } = body;

  if (!destinationUrl) {
    return NextResponse.json({ error: "destinationUrl is required" }, { status: 400 });
  }

  const db = createDb(env.DB);
  const finalSlug = slug || nanoid(7);

  try {
    const [link] = await db
      .insert(links)
      .values({
        id: nanoid(),
        userId: session.user.id,
        slug: finalSlug,
        domain: SHORT_LINK_DOMAIN,
        destinationUrl,
        title: title || null,
        status: "active",
      })
      .returning();

    void env.ZAP_CACHE.put(finalSlug, JSON.stringify(link), { expirationTtl: 60 * 60 * 24 * 7 });

    return NextResponse.json({ link }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }
}
