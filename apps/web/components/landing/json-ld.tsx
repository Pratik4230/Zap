import { siteConfig } from "@/lib/site";
import { PRICING_PLANS } from "@/lib/landing";

export function JsonLd() {
  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteConfig.url,
    description: siteConfig.description,
    offers: PRICING_PLANS.filter((plan) => !plan.comingSoon).map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.price),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    })),
    author: {
      "@type": "Person",
      name: siteConfig.owner.name,
      url: siteConfig.owner.linkedin,
      sameAs: [siteConfig.owner.linkedin, siteConfig.owner.twitter],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      "@type": "Person",
      name: siteConfig.owner.name,
      url: siteConfig.owner.linkedin,
    },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is Xaply free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Xaply offers a generous free plan with up to 50 active links, 5,000 tracked clicks per month across all links, 7-day click history, QR codes, password protection, and link expiry controls. No credit card required.",
        },
      },
      {
        "@type": "Question",
        name: "What does runs on Cloudflare Edge mean?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Xaply uses Cloudflare Workers and KV at the edge for redirects. This is infrastructure we run on, not a sponsorship. Your links resolve close to visitors worldwide for low latency.",
        },
      },
      {
        "@type": "Question",
        name: "What analytics does Xaply provide?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Track clicks over the last 7 days, top countries and cities, devices, browsers, operating systems, and referrers. Per-link analytics are available in the dashboard.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplication) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}
