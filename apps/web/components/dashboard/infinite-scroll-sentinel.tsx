"use client";

import { useEffect, useRef } from "react";
import { BoltSpinner } from "@/components/ui/bolt-skeleton";

interface InfiniteScrollSentinelProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function InfiniteScrollSentinel({
  hasMore,
  isLoading,
  onLoadMore,
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="flex justify-center py-6">
      {isLoading ? (
        <BoltSpinner size={20} />
      ) : (
        <span className="text-xs text-muted-foreground">Scroll for more</span>
      )}
    </div>
  );
}
