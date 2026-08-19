import { FAQ, FEATURES, PRICING_PLANS, STEPS } from "@/lib/landing";
import { siteConfig } from "@/lib/site";

export function JsonLd() {
  const logo = `${siteConfig.url}/icon-512.png`;
  const ogImage = `${siteConfig.url}/og-image.png`;

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: {
          "@type": "ImageObject",
          url: logo,
        },
        image: ogImage,
        description: siteConfig.description,
        email: siteConfig.supportEmail,
        founder: {
          "@type": "Person",
          name: siteConfig.owner.name,
          url: siteConfig.owner.linkedin,
        },
        sameAs: [siteConfig.owner.linkedin, siteConfig.owner.twitter],
        contactPoint: {
          "@type": "ContactPoint",
          email: siteConfig.supportEmail,
          contactType: "customer support",
          url: `${siteConfig.url}/contact`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.name,
        url: siteConfig.url,
        description: siteConfig.description,
        inLanguage: "en-US",
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${siteConfig.url}/#webpage`,
        url: siteConfig.url,
        name: siteConfig.title,
        description: siteConfig.description,
        inLanguage: "en-US",
        isPartOf: { "@id": `${siteConfig.url}/#website` },
        about: { "@id": `${siteConfig.url}/#app` },
        primaryImageOfPage: {
          "@type": "ImageObject",
          url: ogImage,
        },
        breadcrumb: { "@id": `${siteConfig.url}/#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteConfig.url}/#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteConfig.url,
          },
        ],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteConfig.url}/#app`,
        name: siteConfig.name,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "URL shortener",
        operatingSystem: "Web, Android",
        url: siteConfig.url,
        description: siteConfig.description,
        image: ogImage,
        featureList: FEATURES.map((feature) => feature.title),
        offers: PRICING_PLANS.filter((plan) => !plan.comingSoon).map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: String(plan.price),
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${siteConfig.url}${plan.href.split("?")[0]}`,
        })),
        author: {
          "@type": "Person",
          name: siteConfig.owner.name,
          url: siteConfig.owner.linkedin,
          sameAs: [siteConfig.owner.linkedin, siteConfig.owner.twitter],
        },
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
      {
        "@type": "HowTo",
        name: "How to shorten a URL with Xaply",
        description:
          "Paste a long URL, share your short link, and watch click analytics in real time.",
        totalTime: "PT1M",
        step: STEPS.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.title,
          text: step.description,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${siteConfig.url}/#faq`,
        mainEntity: FAQ.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
