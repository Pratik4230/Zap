import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sign in",
  description: "Sign in to your Xaply account to manage short links and analytics.",
  path: "/sign-in",
  index: false,
});

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
