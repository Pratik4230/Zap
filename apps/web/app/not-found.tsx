import Link from "next/link";
import { AppIcon } from "@/components/app-icon";
import type { Metadata } from "next";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you requested could not be found on Xaply.",
  robots: noIndexRobots,
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-6 text-center">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <AppIcon size={24} />
        </div>
        <span className="text-xl font-semibold text-foreground">Xaply</span>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This page does not exist or may have moved. Head back to the homepage or create a free account.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          Go to homepage
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
        >
          Sign up free
        </Link>
      </div>
    </div>
  );
}
