import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import { AMBER, AMBER_BORDER, AMBER_DIM } from "@/lib/landing";
import { siteConfig } from "@/lib/site";

const LEGAL_NAV = [
  { href: siteConfig.legal.privacy, label: "Privacy" },
  { href: siteConfig.legal.terms, label: "Terms" },
  { href: siteConfig.legal.contact, label: "Contact" },
  { href: siteConfig.legal.deleteAccount, label: "Delete account" },
] as const;

export function LegalShell({
  title,
  description,
  lastUpdated,
  children,
}: {
  title: string;
  description: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/6 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: AMBER_DIM,
                border: `1px solid ${AMBER_BORDER}`,
              }}
            >
              <AppIcon size={20} />
            </div>
            <span className="text-base font-bold tracking-tight">Xaply</span>
          </Link>
          <nav className="flex items-center gap-4">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <p className="mt-2 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>

        <div className="legal-prose mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:opacity-80 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_p]:mt-3 [&_strong]:text-foreground/90 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
          {children}
        </div>

        <div className="mt-12 border-t border-white/6 pt-8">
          <p className="text-sm text-muted-foreground">
            Questions?{" "}
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="font-medium text-foreground underline underline-offset-4"
              style={{ textDecorationColor: AMBER }}
            >
              {siteConfig.supportEmail}
            </a>
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Xaply
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/6 px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Xaply. Operated by {siteConfig.owner.name}.</span>
          <div className="flex gap-4">
            {LEGAL_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
