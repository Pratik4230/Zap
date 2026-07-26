import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sign up free",
  description:
    "Create a free Xaply account. Short links with analytics, QR codes, password protection, and edge-fast redirects.",
  path: "/sign-up",
  index: true,
});

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
