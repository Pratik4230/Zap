import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

/**
 * Android App Links verification file.
 * https://xaply.in/.well-known/assetlinks.json
 *
 * Set `ANDROID_SHA256_CERT_FINGERPRINTS` (comma-separated) via:
 *   cd apps/web && npx wrangler secret put ANDROID_SHA256_CERT_FINGERPRINTS
 *
 * Get fingerprints from:
 * - `eas credentials -p android` → SHA256 Fingerprint, or
 * - Play Console → Setup → App signing → Digital Asset Links
 *
 * @see https://docs.expo.dev/linking/android-app-links/
 */
const PACKAGE_NAME = "com.pratik4230.xaply";

function fingerprints(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET() {
  const { env } = getCloudflareContext();
  const sha256 = fingerprints(env.ANDROID_SHA256_CERT_FINGERPRINTS);

  return NextResponse.json(
    [
      {
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: PACKAGE_NAME,
          sha256_cert_fingerprints: sha256,
        },
      },
    ],
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
