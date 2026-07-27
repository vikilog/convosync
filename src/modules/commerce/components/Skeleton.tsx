import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-neutral-200/80 ${className}`}
      aria-hidden
    />
  );
}

export function MetricSkeleton() {
  return (
    <div className="rounded-xl border border-black/5 bg-surface p-5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}
