// frontend/src/components/ui/skeleton.tsx
// Shimmer skeletons. Variants match the SHAPE of the real component they stand in
// for, so loading never causes a layout jump.
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer animate-shimmer rounded-md', className)} />;
}

export function SkeletonStat() {
  return (
    <div className="rounded-card border border-border bg-card p-5 shadow-sm">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-16" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-border bg-card p-4 shadow-sm">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === 0 ? 'w-1/3' : 'flex-1')} />
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-card border border-border bg-card shadow-sm">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}
