import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata = createPageMetadata({
  title: "Sign up free",
  description:
    "Create a free Xaply account. Shorten URLs with Cloudflare edge redirects, real-time analytics, QR codes, and a Business plan for teams.",
  path: "/sign-up",
  index: true,
});

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
