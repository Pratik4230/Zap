import type { CSSProperties, ReactNode } from "react";
import { Zap } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const AMBER = "oklch(0.769 0.188 70.08)";

function boltDelayStyle(delayMs: number): CSSProperties | undefined {
  return delayMs > 0 ? { animationDelay: `${delayMs}ms` } : undefined;
}

export function BoltIcon({
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

export function BoltTrack({
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
        "relative overflow-hidden rounded-md bg-white/8 ring-1 ring-inset ring-white/12",
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

export function BoltBadgeSkeleton({ className = "h-5 w-24", delayMs = 0 }: { className?: string; delayMs?: number }) {
  return (
    <div className={cn("flex items-center justify-end", className)}>
      <BoltIcon size={14} delayMs={delayMs} />
    </div>
  );
}

export function BoltPillSkeleton({ className = "h-6 w-16", delayMs = 0 }: { className?: string; delayMs?: number }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-white/8 ring-1 ring-inset ring-white/12",
        className,
      )}
      aria-hidden
    >
      <BoltIcon size={12} delayMs={delayMs} />
    </div>
  );
}

export function BoltHeaderSkeleton({
  titleWidth = "w-64",
  subtitleWidth = "w-96",
}: {
  titleWidth?: string;
  subtitleWidth?: string;
}) {
  return (
    <div className="space-y-2">
      <BoltTrack className={cn("h-8", titleWidth)} delayMs={0} boltSize={16} />
      <BoltTrack className={cn("h-4", subtitleWidth)} delayMs={120} boltSize={12} />
    </div>
  );
}

export function BoltStatSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="flex h-8 items-center gap-2">
      <BoltIcon size={28} delayMs={index * 120} />
      <BoltIcon size={18} delayMs={index * 120 + 400} className="opacity-60" />
    </div>
  );
}

export function BoltCountSkeleton() {
  return (
    <div className="flex items-center gap-1.5">
      <BoltIcon size={12} delayMs={0} />
      <BoltIcon size={10} delayMs={300} className="opacity-70" />
    </div>
  );
}

export function BoltChartBarsSkeleton({
  bars = 7,
  heights,
}: {
  bars?: number;
  heights?: number[];
}) {
  const barHeights = heights ?? Array.from({ length: bars }, (_, i) => 35 + (i % 5) * 12);

  return (
    <div className="flex h-40 items-end gap-2 overflow-hidden">
      {barHeights.map((height, i) => (
        <div key={i} className="flex min-w-5 flex-1 flex-col items-center gap-2">
          <div
            className="relative flex w-full items-end justify-center overflow-hidden rounded-t-md bg-white/8 ring-1 ring-inset ring-white/12"
            style={{ height: `${height}%` }}
          >
            <BoltIcon size={12} delayMs={i * 80} className="mb-1" />
          </div>
          <BoltIcon size={10} delayMs={i * 80 + 120} />
        </div>
      ))}
    </div>
  );
}

export function BoltRankedListSkeleton({
  rows = 5,
  labelWidth = "w-32",
}: {
  rows?: number;
  labelWidth?: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <BoltTrack className={cn("h-4", labelWidth)} delayMs={i * 70} boltSize={12} />
            <BoltIcon size={14} delayMs={i * 70 + 50} />
          </div>
          <BoltTrack className="h-1 w-full" delayMs={i * 70 + 100} boltSize={10} />
        </div>
      ))}
    </div>
  );
}

export function BoltPanelSkeleton({ rows = 5 }: { rows?: number }) {
  return <BoltRankedListSkeleton rows={rows} labelWidth="w-full max-w-xs" />;
}

export function BoltDeviceRingsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/8 ring-1 ring-inset ring-white/12">
            <BoltIcon size={24} delayMs={i * 150} />
          </div>
          <BoltTrack className="h-4 w-12" delayMs={i * 150 + 80} boltSize={10} />
        </div>
      ))}
    </div>
  );
}

const LINK_ROW_LAYOUTS = [
  { slug: "w-36", title: "w-28", destination: "w-52", clicks: "w-10", date: "w-24" },
  { slug: "w-32", title: null, destination: "w-44", clicks: "w-8", date: "w-20" },
  { slug: "w-40", title: "w-24", destination: "w-56", clicks: "w-12", date: "w-24" },
  { slug: "w-28", title: "w-32", destination: "w-48", clicks: "w-10", date: "w-20" },
  { slug: "w-32", title: null, destination: "w-40", clicks: "w-8", date: "w-20" },
  { slug: "w-36", title: "w-20", destination: "w-52", clicks: "w-14", date: "w-24" },
] as const;

export function DashboardLinkTableSkeletonRows({ rows = 6 }: { rows?: number }) {
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
              <BoltPillSkeleton className="h-5 w-16" delayMs={rowDelay + 240} />
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

export function AdminTableSkeletonRows({ rows = 8, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="border-white/6">
          {Array.from({ length: cols }).map((__, colIndex) => {
            const delayMs = rowIndex * 70 + colIndex * 40;
            return (
              <TableCell key={colIndex} className="py-3">
                {colIndex === 0 ? (
                  <BoltTrack className="h-4 w-full max-w-28" delayMs={delayMs} boltSize={12} />
                ) : colIndex === cols - 1 ? (
                  <BoltIcon size={14} delayMs={delayMs} />
                ) : (
                  <BoltTrack className="h-4 w-full max-w-24" delayMs={delayMs} boltSize={11} />
                )}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

export function BoltSpinner({ size = 20, className }: { size?: number; className?: string }) {
  return <BoltIcon size={size} className={className} />;
}
