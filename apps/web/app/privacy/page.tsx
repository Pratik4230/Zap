import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL_LAST_UPDATED, LEGAL_OPERATOR } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "How Xaply collects, uses, and shares data for the web app, mobile app, and short links.",
  path: "/privacy",
  index: true,
});

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      description={`How ${LEGAL_OPERATOR.product} handles your information.`}
      lastUpdated={LEGAL_LAST_UPDATED}
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          {LEGAL_OPERATOR.product} (“Xaply”, “we”, “us”) is operated by{" "}
          <strong>{LEGAL_OPERATOR.name}</strong>, an individual based in{" "}
          {LEGAL_OPERATOR.location}. This policy covers{" "}
          <a href={`https://${siteConfig.appDomain}`}>xaply.in</a>, short links on{" "}
          <a href={`https://${siteConfig.shortLinkDomain}`}>go.xaply.in</a>, and the
          Xaply mobile apps.
        </p>
        <p>
          Contact:{" "}
          <a href={`mailto:${LEGAL_OPERATOR.email}`}>{LEGAL_OPERATOR.email}</a>
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <p>Depending on how you use Xaply, we may process:</p>
        <ul>
          <li>
            <strong>Account data</strong>: name, email address, email verification
            status, profile image (if provided by you or an OAuth provider), and
            hashed passwords for email/password accounts.
          </li>
          <li>
            <strong>Authentication data</strong>: session tokens, OAuth account
            identifiers and tokens from Google or GitHub when you sign in with
            those providers, and session metadata such as IP address and user
            agent used to secure your login.
          </li>
          <li>
            <strong>Link data you create</strong>: destination URLs, custom
            slugs, titles, optional password hashes for protected links, expiry
            settings, click limits, and optional deep-link / store URLs.
          </li>
          <li>
            <strong>Click analytics</strong>: when someone opens a short link we
            store aggregated visit details: approximate country and city (from
            edge network geo), device type, OS, browser family, referrer, and
            timestamp. We do <strong>not</strong> store the visitor’s raw IP
            address or full user-agent string in analytics records.
          </li>
          <li>
            <strong>Billing data</strong>: if you subscribe to Pro, our payment
            processor (currently Dodo Payments on the web; mobile in-app purchases
            may use the platform store / RevenueCat when enabled) processes
            payment details. We store a customer reference ID and your plan
            status. We do not store full card numbers.
          </li>
          <li>
            <strong>Transactional email</strong>: verification codes, password
            resets, and operational notices (for example when you hit monthly
            visit limits) sent via our email provider (Resend).
          </li>
          <li>
            <strong>Cookies and similar tech</strong>: session cookies for signed-in
            users, and short-lived unlock cookies for password-protected links.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How we use information</h2>
        <ul>
          <li>Provide, operate, and secure the service (short links, dashboard, apps)</li>
          <li>Show you analytics about your links</li>
          <li>Authenticate you and prevent abuse / rate-limit misuse</li>
          <li>Process subscriptions and communicate about billing</li>
          <li>Send essential account and service emails</li>
          <li>Improve reliability and investigate issues</li>
          <li>Comply with law and enforce our Terms</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </section>

      <section>
        <h2>4. Sharing and processors</h2>
        <p>We use trusted service providers that process data on our behalf:</p>
        <ul>
          <li>
            <strong>Cloudflare</strong>: hosting, edge redirects, storage (e.g.
            D1/KV), geo for analytics, and security
          </li>
          <li>
            <strong>Better Auth</strong>: authentication library used in our app
          </li>
          <li>
            <strong>Google / GitHub</strong>: optional social sign-in
          </li>
          <li>
            <strong>Resend</strong>: transactional email
          </li>
          <li>
            <strong>Dodo Payments</strong>: web subscriptions and billing portal
          </li>
          <li>
            <strong>Apple App Store / Google Play</strong> (and related billing
            partners, if used): mobile purchases when offered
          </li>
        </ul>
        <p>
          We may disclose information if required by law, to protect rights and
          safety, or in connection with a transfer of the service (with notice
          where appropriate).
        </p>
      </section>

      <section>
        <h2>5. Data retention</h2>
        <p>
          We keep account and link data while your account is active. Click
          analytics may be retained for service operation; your plan controls how
          far back you can browse history in the dashboard (Free: 7 days; Pro: up
          to 1 year). Ephemeral rate-limit and cache keys expire automatically.
        </p>
        <p>
          After you delete your account, we remove your user record and related
          workspace, links, and click data from our database (cascading deletes).
          Payment-provider records, email logs, and short-lived cache entries may
          remain with those providers or expire on their own schedules.
        </p>
      </section>

      <section>
        <h2>6. Your choices</h2>
        <ul>
          <li>
            <strong>Access / update</strong>: manage profile and password in{" "}
            <Link href="/settings">Settings</Link>
          </li>
          <li>
            <strong>Delete account</strong>: see{" "}
            <Link href={siteConfig.legal.deleteAccount}>Delete your account</Link>{" "}
            for steps, or use Settings (Danger Zone). You can also email us at{" "}
            <a href={`mailto:${LEGAL_OPERATOR.email}`}>{LEGAL_OPERATOR.email}</a>
          </li>
          <li>
            <strong>Billing</strong>: manage or cancel Pro via the billing portal
            in Settings (web) or the relevant app store (mobile IAP, when available)
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Children</h2>
        <p>
          Xaply is available to users of all ages. We do not knowingly collect
          special categories of children’s data beyond what is needed to operate
          the same service for everyone. A parent or guardian may contact us to
          request deletion of an account used by a child.
        </p>
      </section>

      <section>
        <h2>8. Security and international processing</h2>
        <p>
          We use industry-standard practices (HTTPS, hashed passwords, edge
          infrastructure). No method of transmission or storage is 100% secure.
          Data may be processed in locations where our providers operate,
          including outside India.
        </p>
      </section>

      <section>
        <h2>9. Changes</h2>
        <p>
          We may update this policy from time to time. The “Last updated” date at
          the top will change when we do. Continued use after changes means you
          accept the updated policy.
        </p>
      </section>

      <section>
        <h2>10. Contact</h2>
        <p>
          Privacy questions:{" "}
          <a href={`mailto:${LEGAL_OPERATOR.email}`}>{LEGAL_OPERATOR.email}</a>
          <br />
          Also see our{" "}
          <Link href={siteConfig.legal.terms}>Terms of Service</Link> and{" "}
          <Link href={siteConfig.legal.contact}>Contact</Link> page.
        </p>
      </section>
    </LegalShell>
  );
}
