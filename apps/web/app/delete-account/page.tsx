import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL_LAST_UPDATED, LEGAL_OPERATOR } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = createPageMetadata({
  title: "Delete your Xaply account",
  description:
    "How to delete your Xaply account and what data is removed or retained.",
  path: "/delete-account",
  index: true,
});

export default function DeleteAccountPage() {
  return (
    <LegalShell
      title="Delete your Xaply account"
      description={`Request deletion of your ${LEGAL_OPERATOR.product} account and associated data.`}
      lastUpdated={LEGAL_LAST_UPDATED}
    >
      <section>
        <h2>About Xaply</h2>
        <p>
          <strong>{LEGAL_OPERATOR.product}</strong> is operated by{" "}
          <strong>{LEGAL_OPERATOR.name}</strong>. This page explains how to
          permanently delete your Xaply account (web app and Android app) and what
          happens to your data.
        </p>
      </section>

      <section>
        <h2>How to delete your account (in the app or website)</h2>
        <ol>
          <li>
            Sign in to Xaply at{" "}
            <a href="https://xaply.in/sign-in">https://xaply.in/sign-in</a> or in
            the Xaply Android app (same account).
          </li>
          <li>
            Open <strong>Settings</strong> (
            <a href="https://xaply.in/settings">https://xaply.in/settings</a> on
            the web).
          </li>
          <li>
            Go to the <strong>Danger Zone</strong> / delete account section.
          </li>
          <li>
            Type your account email to confirm, then confirm deletion.
          </li>
        </ol>
        <p>
          Deletion is permanent. You will be signed out and will need a new account
          to use Xaply again.
        </p>
      </section>

      <section>
        <h2>How to request deletion by email</h2>
        <p>
          If you cannot sign in, email us from the address on your Xaply account:
        </p>
        <p>
          <a href={`mailto:${LEGAL_OPERATOR.email}?subject=Xaply%20account%20deletion%20request`}>
            {LEGAL_OPERATOR.email}
          </a>
        </p>
        <p>
          Include: (1) the email on the account, (2) that you want the account and
          associated data deleted. We will process verified requests.
        </p>
      </section>

      <section>
        <h2>Data that is deleted</h2>
        <p>When your account is deleted, we remove from our database:</p>
        <ul>
          <li>Your user profile (name, email, profile image reference)</li>
          <li>Authentication data (sessions, credential / OAuth account records)</li>
          <li>Your workspace(s) and plan association on Xaply</li>
          <li>Your short links and related settings (passwords, expiry, deep-link fields)</li>
          <li>Click analytics stored for those links</li>
        </ul>
      </section>

      <section>
        <h2>Data that may be retained</h2>
        <ul>
          <li>
            <strong>Payment providers</strong> — if you subscribed to Pro, billing
            records may remain with Dodo Payments and/or Google Play (or Apple)
            under their retention rules. Cancel subscriptions in Settings or the
            store before or after deletion as needed.
          </li>
          <li>
            <strong>Email delivery logs</strong> — transactional email providers
            (e.g. Resend) may keep delivery metadata for a limited time.
          </li>
          <li>
            <strong>Caches and rate-limit keys</strong> — short-lived Cloudflare KV
            entries (plan cache, rate limits) expire automatically and are not kept
            as an account archive.
          </li>
          <li>
            <strong>Legal holds</strong> — we may retain limited information if
            required by law, to resolve disputes, or to prevent abuse.
          </li>
        </ul>
        <p>
          We do not keep your account profile or links in an active, usable form
          after deletion completes.
        </p>
      </section>

      <section>
        <h2>Timing</h2>
        <p>
          In-app / Settings deletion takes effect when the request succeeds
          (typically immediately for our database). Email requests are handled as
          soon as we can verify ownership, usually within a few business days.
        </p>
      </section>

      <section>
        <h2>More information</h2>
        <p>
          <Link href={siteConfig.legal.privacy}>Privacy Policy</Link>
          {" · "}
          <Link href={siteConfig.legal.terms}>Terms of Service</Link>
          {" · "}
          <Link href={siteConfig.legal.contact}>Contact</Link>
        </p>
      </section>
    </LegalShell>
  );
}
