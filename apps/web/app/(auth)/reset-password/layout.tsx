import { createPageMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata = createPageMetadata({
  title: "Reset password",
  description: "Choose a new password for your Xaply account.",
  path: "/reset-password",
  index: false,
});

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
