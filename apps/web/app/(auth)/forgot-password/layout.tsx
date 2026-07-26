import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Forgot password",
  description: "Reset your Xaply account password.",
  path: "/forgot-password",
  index: false,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
