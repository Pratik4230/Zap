import Link from "next/link";
import { AppIcon } from "@/components/app-icon";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, oklch(1 0 0 / 6%) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div
        className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "oklch(0.769 0.188 70.08)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-15 blur-3xl"
        style={{ background: "oklch(0.769 0.188 70.08)" }}
      />

      <Link href="/" className="mb-8 flex items-center gap-2.5 group">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: "oklch(0.769 0.188 70.08 / 12%)",
            border: "1px solid oklch(0.769 0.188 70.08 / 25%)",
          }}
        >
          <AppIcon size={24} />
        </div>
        <span className="text-xl font-semibold tracking-tight text-foreground">
          Xaply
        </span>
      </Link>

      <div
        className="relative w-full max-w-sm rounded-2xl border p-8 shadow-2xl"
        style={{
          background: "oklch(1 0 0 / 4%)",
          backdropFilter: "blur(24px)",
          borderColor: "oklch(0.769 0.188 70.08 / 18%)",
          boxShadow: "0 0 0 1px oklch(0.769 0.188 70.08 / 10%), 0 32px 64px oklch(0 0 0 / 50%)",
        }}
      >
        {children}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Xaply. All rights reserved.
      </p>
    </div>
  );
}
