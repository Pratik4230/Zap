import { NextResponse } from "next/server";

/**
 * Android App Links verification file.
 * https://xaply.in/.well-known/assetlinks.json
 *
 * Set `ANDROID_SHA256_CERT_FINGERPRINTS` (comma-separated) from:
 * - `eas credentials -p android` → SHA256 Fingerprint, or
 * - Play Console → Setup → App signing → Digital Asset Links
 *
 * @see https://docs.expo.dev/linking/android-app-links/
 */
const PACKAGE_NAME = "com.pratik4230.xaply";

function fingerprints(): string[] {
  const raw = process.env.ANDROID_SHA256_CERT_FINGERPRINTS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET() {
  const sha256 = fingerprints();

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
    }
  );
}
