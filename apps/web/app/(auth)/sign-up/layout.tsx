import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sign up free",
  description:
    "Create a free Xaply account. Free URL shortener with the fastest edge redirects, analytics, and a Business plan for teams.",
  path: "/sign-up",
  index: true,
});

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
