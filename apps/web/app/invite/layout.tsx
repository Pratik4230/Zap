import { noIndexRobots } from "@/lib/seo";

export const metadata = {
  title: "Accept invite",
  robots: noIndexRobots,
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
