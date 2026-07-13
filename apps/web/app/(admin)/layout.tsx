import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { AppIcon } from "@/components/app-icon";

const AMBER = "oklch(0.769 0.188 70.08)";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "oklch(0.08 0 0)" }}>
      <header
        className="flex h-16 shrink-0 items-center justify-between border-b border-white/6 px-4 md:px-6"
        style={{ background: "oklch(0.1 0 0 / 80%)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: `${AMBER}20`, border: `1px solid ${AMBER}40` }}
          >
            <AppIcon size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Admin</p>
            <p className="text-xs text-muted-foreground">Xaply</p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users size={16} style={{ color: AMBER }} />
          <span>Users</span>
        </div>
        {children}
      </div>
    </div>
  );
}
