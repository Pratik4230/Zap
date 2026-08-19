import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata = createPageMetadata({
  title: "Verify email",
  description: "Verify your email address to activate your Xaply account.",
  path: "/verify-email",
  index: false,
});

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
