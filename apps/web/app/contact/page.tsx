import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL_LAST_UPDATED, LEGAL_OPERATOR } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description: "Contact Xaply support for account, privacy, and product questions.",
  path: "/contact",
  index: true,
});

export default function ContactPage() {
  return (
    <LegalShell
      title="Contact us"
      description="How to reach the person behind Xaply."
      lastUpdated={LEGAL_LAST_UPDATED}
    >
      <section>
        <h2>Support</h2>
        <p>
          For account help, billing questions, privacy requests, abuse reports, or
          product feedback, email:
        </p>
        <p>
          <a
            href={`mailto:${LEGAL_OPERATOR.email}?subject=Xaply%20support`}
            className="text-base font-medium"
          >
            {LEGAL_OPERATOR.email}
          </a>
        </p>
        <p>
          Operated by <strong>{LEGAL_OPERATOR.name}</strong> ({LEGAL_OPERATOR.location}).
          Free and Pro: we aim to reply within a few business days. Business
          subscribers get priority support and we aim to reply within 1 business
          day.
        </p>
      </section>

      <section>
        <h2>What to include</h2>
        <ul>
          <li>The email on your Xaply account (if you have one)</li>
          <li>Whether you’re writing about web, Android, or short links</li>
          <li>A clear description of the issue or request</li>
          <li>
            For abuse: the short link URL and why you believe it violates our{" "}
            <Link href={siteConfig.legal.terms}>Terms</Link>
          </li>
        </ul>
      </section>

      <section>
        <h2>Billing and refunds</h2>
        <p>
          Web Pro is managed via the billing portal in{" "}
          <Link href="/settings">Settings</Link>. Mobile purchases (when available)
          are managed through Google Play or the Apple App Store.
        </p>
        <p>
          <strong>Xaply does not offer refunds.</strong> See the{" "}
          <Link href={siteConfig.legal.terms}>Terms of Service</Link> (No refunds
          section). App stores may have their own refund processes for store
          purchases.
        </p>
      </section>

      <section>
        <h2>Privacy and account deletion</h2>
        <p>
          Read our <Link href={siteConfig.legal.privacy}>Privacy Policy</Link>. To
          delete your account and links, use Settings → Danger Zone, or email us
          from the address on your account.
        </p>
      </section>

      <section>
        <h2>Elsewhere</h2>
        <ul>
          <li>
            <a href={siteConfig.owner.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={siteConfig.owner.twitter} target="_blank" rel="noopener noreferrer">
              {siteConfig.owner.twitterHandle}
            </a>
          </li>
        </ul>
      </section>
    </LegalShell>
  );
}
