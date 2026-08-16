import type { CSSProperties, ReactNode } from "react";
import { Zap } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const AMBER = "oklch(0.769 0.188 70.08)";

const LINK_ROW_LAYOUTS = [
  { slug: "w-36", title: "w-28", destination: "w-52", clicks: "w-10", date: "w-24" },
  { slug: "w-32", title: null, destination: "w-44", clicks: "w-8", date: "w-20" },
  { slug: "w-40", title: "w-24", destination: "w-56", clicks: "w-12", date: "w-24" },
  { slug: "w-28", title: "w-32", destination: "w-48", clicks: "w-10", date: "w-20" },
  { slug: "w-32", title: null, destination: "w-40", clicks: "w-8", date: "w-20" },
  { slug: "w-36", title: "w-20", destination: "w-52", clicks: "w-14", date: "w-24" },
] as const;

function boltDelayStyle(delayMs: number): CSSProperties | undefined {
  return delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined;
}

function BoltIcon({
  size = 16,
  delayMs = 0,
  className,
}: {
  size?: number;
  delayMs?: number;
  className?: string;
}) {
  return (
    <Zap
      size={size}
      className={cn("animate-bolt-flash fill-primary/45 text-primary", className)}
      style={{ color: AMBER, ...boltDelayStyle(delayMs) }}
      aria-hidden
    />
  );
}

function BoltTrack({
  className,
  delayMs = 0,
  boltSize = 14,
}: {
  className?: string;
  delayMs?: number;
  boltSize?: number;
}) {
  return (
    <div
      className={cn(
        "relative h-4 overflow-hidden rounded-md bg-white/8 ring-1 ring-inset ring-white/12",
        className,
      )}
      aria-hidden
    >
      <Zap
        size={boltSize}
        className="absolute top-1/2 animate-bolt-strike fill-primary/50 text-primary"
        style={{ color: AMBER, ...boltDelayStyle(delayMs) }}
      />
    </div>
  );
}

export function fadeInClass() {
  return "animate-in fade-in duration-300 fill-mode-both";
}

export function fadeInStyle(delayMs = 0): CSSProperties | undefined {
  return delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined;
}

export function FadeIn({
  show,
  delayMs = 0,
  className,
  children,
}: {
  show: boolean;
  delayMs?: number;
  className?: string;
  children: ReactNode;
}) {
  if (!show) return null;

  return (
    <div className={cn(fadeInClass(), className)} style={fadeInStyle(delayMs)}>
      {children}
    </div>
  );
}

export function StatValueSkeleton({ index }: { index: number }) {
  return (
    <div className="flex h-8 items-center gap-2">
      <BoltIcon size={28} delayMs={index * 120} />
      <BoltIcon size={18} delayMs={index * 120 + 400} className="opacity-60" />
    </div>
  );
}

export function LinkTableSkeletonRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => {
        const layout = LINK_ROW_LAYOUTS[i % LINK_ROW_LAYOUTS.length];
        const rowDelay = i * 90;

        return (
          <TableRow key={i} className="border-white/6">
            <TableCell className="py-4 pl-6">
              <div className="space-y-2">
                <BoltTrack className={cn("h-4", layout.slug)} delayMs={rowDelay} />
                {layout.title && (
                  <BoltTrack className={cn("h-3", layout.title)} delayMs={rowDelay + 200} boltSize={12} />
                )}
              </div>
            </TableCell>
            <TableCell className="py-4">
              <BoltTrack className={cn("h-4", layout.destination)} delayMs={rowDelay + 80} />
            </TableCell>
            <TableCell className="py-4 text-right">
              <div className="flex justify-end">
                <BoltIcon size={16} delayMs={rowDelay + 160} />
              </div>
            </TableCell>
            <TableCell className="py-4">
              <div className="flex h-5 w-16 items-center justify-center rounded-full bg-white/8 ring-1 ring-inset ring-white/12">
                <BoltIcon size={12} delayMs={rowDelay + 240} />
              </div>
            </TableCell>
            <TableCell className="py-4">
              <BoltTrack className={cn("h-4", layout.date)} delayMs={rowDelay + 320} boltSize={12} />
            </TableCell>
            <TableCell className="py-4">
              <div className="flex justify-end">
                <BoltIcon size={14} delayMs={rowDelay + 400} />
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export function LinkCountSkeleton() {
  return (
    <div className="flex items-center gap-1.5">
      <BoltIcon size={12} delayMs={0} />
      <BoltIcon size={10} delayMs={300} className="opacity-70" />
    </div>
  );
}
