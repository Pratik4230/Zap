import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL_LAST_UPDATED, LEGAL_OPERATOR } from "@/lib/legal";
import { createPageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = createPageMetadata({
  title: "Terms of Service",
  description:
    "Terms governing use of Xaply, including plans, acceptable use, and our no-refund policy.",
  path: "/terms",
  index: true,
});

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms of Service"
      description={`Rules for using ${LEGAL_OPERATOR.product}.`}
      lastUpdated={LEGAL_LAST_UPDATED}
    >
      <section>
        <h2>1. Agreement</h2>
        <p>
          These Terms of Service (“Terms”) are a contract between you and{" "}
          <strong>{LEGAL_OPERATOR.name}</strong> (“we”, “us”), operator of{" "}
          {LEGAL_OPERATOR.product} (“Xaply”). By creating an account or using
          Xaply (website, short links, or mobile apps), you agree to these Terms
          and our{" "}
          <Link href={siteConfig.legal.privacy}>Privacy Policy</Link>.
        </p>
        <p>
          Governing law: laws of India. Courts in Pune, Maharashtra, India have
          exclusive jurisdiction, subject to applicable consumer protections.
        </p>
      </section>

      <section>
        <h2>2. The service</h2>
        <p>
          Xaply lets you create short links (on {siteConfig.shortLinkDomain}),
          view click analytics, generate QR codes, and use optional controls such
          as passwords and expiry. Features may change as we improve the product.
        </p>
      </section>

      <section>
        <h2>3. Accounts</h2>
        <ul>
          <li>You must provide accurate registration information.</li>
          <li>You are responsible for activity under your account and for keeping credentials secure.</li>
          <li>
            You may delete your account anytime in{" "}
            <Link href="/settings">Settings</Link>. Deletion removes your account,
            workspaces, links, and related click data from our database, subject to
            the retention notes in the Privacy Policy.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Plans and billing</h2>
        <p>Current plans (subject to change with notice on the site):</p>
        <ul>
          <li>
            <strong>Free</strong>: up to 50 active links, 5,000 tracked visits per
            month (UTC), 7-day analytics history in the dashboard, custom slugs,
            QR codes, password and expiry controls.
          </li>
          <li>
            <strong>Pro</strong>: $12/month: up to 500 active links, 50,000
            tracked visits per month, up to 1 year of analytics history, and
            priority email support.
          </li>
        </ul>
        <p>
          Web Pro subscriptions are billed through Dodo Payments. Mobile Pro, when
          offered, may be billed through Google Play / Apple and related partners.
          Hitting Free or Pro visit limits may cause redirects to stop until the
          next month or until you upgrade.
        </p>
        <p>
          You may cancel a subscription anytime via Settings (web billing portal)
          or the applicable app store. Cancellation stops future renewals; it does
          not entitle you to a refund for time already paid.
        </p>
      </section>

      <section>
        <h2>5. No refunds</h2>
        <p>
          <strong>
            All fees are non-refundable to the fullest extent permitted by law.
          </strong>{" "}
          This includes Pro subscriptions on the web and any in-app purchases.
          We do not offer refunds, credits, or prorated refunds for partial months,
          unused capacity, downgrades, cancellations, account deletion, or
          dissatisfaction after purchase, except where a mandatory consumer law
          requires otherwise.
        </p>
        <p>
          Platform stores (Google Play / Apple) may apply their own refund rules
          for purchases made through them; those rules are between you and the
          store. Where we control refunds directly, our policy is no refunds.
        </p>
      </section>

      <section>
        <h2>6. Acceptable use</h2>
        <p>You agree not to use Xaply to:</p>
        <ul>
          <li>Violate law or third-party rights</li>
          <li>Distribute malware, phishing, or scam content</li>
          <li>Host or promote illegal, violent, or sexually exploitative material involving minors</li>
          <li>Abuse, overload, or attempt to disrupt the service or other users</li>
          <li>Circumvent plan limits, security, or access controls</li>
          <li>Misrepresent affiliation with Xaply</li>
        </ul>
        <p>
          We may suspend or terminate accounts, disable links, or remove content
          that we reasonably believe violates these Terms or harms the service or
          others.
        </p>
      </section>

      <section>
        <h2>7. Your content and links</h2>
        <p>
          You retain rights to the URLs and content you submit. You grant us a
          license to host, process, and display them as needed to operate Xaply
          (including redirects and analytics). You are solely responsible for
          destinations you shorten and for having rights to share them.
        </p>
      </section>

      <section>
        <h2>8. Intellectual property</h2>
        <p>
          Xaply’s branding, software, and site content are owned by us or our
          licensors. You may not copy, reverse engineer, or resell the service
          except as allowed by law.
        </p>
      </section>

      <section>
        <h2>9. Disclaimers</h2>
        <p>
          Xaply is provided <strong>“as is”</strong> and <strong>“as available”</strong>{" "}
          without warranties of any kind, express or implied, including
          merchantability, fitness for a particular purpose, and non-infringement.
          We do not guarantee uninterrupted or error-free operation, or that short
          links will always resolve.
        </p>
      </section>

      <section>
        <h2>10. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, we are not liable for indirect,
          incidental, special, consequential, or punitive damages, or for lost
          profits, data, or goodwill. Our total liability for any claim relating to
          Xaply is limited to the greater of (a) the amounts you paid us for Pro in
          the 3 months before the claim, or (b) USD $50.
        </p>
      </section>

      <section>
        <h2>11. Changes</h2>
        <p>
          We may update these Terms. We will update the “Last updated” date. Material
          changes may be communicated by email or in-product notice where
          reasonable. Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section>
        <h2>12. Contact</h2>
        <p>
          <a href={`mailto:${LEGAL_OPERATOR.email}`}>{LEGAL_OPERATOR.email}</a>
          <br />
          <Link href={siteConfig.legal.contact}>Contact page</Link> ·{" "}
          <Link href={siteConfig.legal.privacy}>Privacy Policy</Link>
        </p>
      </section>
    </LegalShell>
  );
}
