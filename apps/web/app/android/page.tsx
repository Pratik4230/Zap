import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { LegalShell } from "@/components/legal/legal-shell";
import { AMBER } from "@/lib/landing";
import { androidBeta } from "@/lib/android-beta";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = createPageMetadata({
  title: "Android (closed beta)",
  description:
    "Download the Xaply Android closed-beta APK. Package com.pratik4230.xaply.",
  path: androidBeta.pagePath,
  index: false,
});

export default function AndroidBetaPage() {
  const hasApk = Boolean(androidBeta.apkUrl);

  return (
    <LegalShell
      title="Xaply for Android"
      description="Closed beta APK for testers and merchant verification. Not a Play Store listing."
      lastUpdated={androidBeta.lastUpdated}
    >
      <section>
        <p>
          <span
            className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase"
            style={{
              borderColor: "oklch(0.769 0.188 70.08 / 35%)",
              color: AMBER,
              background: "oklch(0.769 0.188 70.08 / 10%)",
            }}
          >
            {androidBeta.statusLabel}
          </span>
        </p>
        <p>
          Xaply is a URL shortener with edge-fast redirects and analytics. This
          page hosts the latest Android beta build while the app is in closed
          testing on Google Play.
        </p>
      </section>

      <section>
        <h2>App details</h2>
        <ul>
          <li>
            <strong>Package:</strong> <code>{androidBeta.packageName}</code>
          </li>
          <li>
            <strong>Version:</strong> {androidBeta.versionName} (
            {androidBeta.versionCode})
          </li>
          <li>
            <strong>Page URL:</strong>{" "}
            <code>
              {siteConfig.url}
              {androidBeta.pagePath}
            </code>
          </li>
          {hasApk ? (
            <li>
              <strong>APK ({androidBeta.hostLabel}):</strong>{" "}
              <a href={androidBeta.apkUrl} className="break-all">
                {androidBeta.apkUrl}
              </a>
            </li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2>Download</h2>
        {hasApk ? (
          <>
            <p>
              File is hosted on {androidBeta.hostLabel}. Install only if you
              trust this source. Enable “Install unknown apps” for your browser
              if Android asks.
            </p>
            <p className="mt-4">
              <a
                href={androidBeta.apkUrl}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold no-underline transition-opacity hover:opacity-90"
                style={{ background: AMBER, color: "oklch(0 0 0)" }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={16} aria-hidden />
                Download APK (v{androidBeta.versionName})
              </a>
            </p>
            <p className="mt-3 text-xs">
              Opens Google Drive ({androidBeta.hostLabel}). Download{" "}
              <code>base.apk</code> from the shared folder.
            </p>
          </>
        ) : (
          <p>
            The APK is not linked yet. Upload a preview build to Google Drive
            (Anyone with the link), paste the URL into{" "}
            <code>apkUrl</code>, redeploy web, then this button will appear.
            Until then, use Play internal testing if you have an invite.
          </p>
        )}
      </section>

      <section>
        <h2>For BillDesk / reviewers</h2>
        <p>
          Use this page (<code>{siteConfig.url}{androidBeta.pagePath}</code>)
          {hasApk ? (
            <>
              {" "}
              or the direct APK URL above. The app is in{" "}
              <strong>closed beta</strong> on Google Play and is not publicly
              listed yet.
            </>
          ) : (
            <>
              . A public APK URL will be published here once the beta binary is
              uploaded.
            </>
          )}
        </p>
      </section>

      <section>
        <h2>Legal</h2>
        <ul>
          <li>
            <Link href={siteConfig.legal.terms}>Terms of Service</Link>
          </li>
          <li>
            <Link href={siteConfig.legal.privacy}>Privacy Policy</Link>
          </li>
          <li>
            <Link href={siteConfig.legal.contact}>Contact / billing</Link>
          </li>
        </ul>
      </section>
    </LegalShell>
  );
}
