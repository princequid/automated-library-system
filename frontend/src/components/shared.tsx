// frontend/src/components/shared.tsx
// Small presentational pieces reused across portals: a book cover placeholder, an
// availability badge, a due-date badge, and a page header.
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { dueUrgency } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CatalogItem } from '@/lib/types';

export function BookCover({
  item,
  className,
}: {
  item: Pick<CatalogItem, 'title' | 'cover_url'>;
  className?: string;
}) {
  if (item.cover_url) {
    return (
      <img
        src={item.cover_url}
        alt={`Cover of ${item.title}`}
        className={cn('h-full w-full rounded-md object-cover', className)}
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-md bg-primary-tint text-primary',
        className
      )}
      aria-hidden
    >
      <BookOpen className="h-8 w-8 opacity-70" />
    </div>
  );
}

export function AvailabilityBadge({ available }: { available: number }) {
  if (available <= 0) return <Badge variant="neutral">Reserve only</Badge>;
  if (available === 1) return <Badge variant="warning">1 left</Badge>;
  return <Badge variant="success">{available} available</Badge>;
}

export type CirculationStatus = 'AVAILABLE' | 'ON_LOAN' | 'RESERVED' | 'DAMAGED' | 'LOST' | 'WITHDRAWN' | 'RETURNED';

const CIRCULATION_STATUS_VARIANT: Record<CirculationStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  AVAILABLE: 'success',
  ON_LOAN: 'info', // checked out is a normal, informational state - not an achievement (success) or a problem (warning)
  RESERVED: 'warning',
  DAMAGED: 'error',
  LOST: 'error',
  WITHDRAWN: 'neutral',
  RETURNED: 'neutral',
};

const CIRCULATION_STATUS_LABEL: Record<CirculationStatus, string> = {
  AVAILABLE: 'Available',
  ON_LOAN: 'On loan',
  RESERVED: 'Reserved',
  DAMAGED: 'Damaged',
  LOST: 'Lost',
  WITHDRAWN: 'Withdrawn',
  RETURNED: 'Returned',
};

/**
 * One status -> color mapping for a copy/loan's circulation state, used by both
 * Catalog's copy list and Dashboard's recent-activity table so the same
 * real-world fact ("this item is checked out") always reads the same color
 * regardless of which page it's shown on.
 */
export function CirculationStatusBadge({ status }: { status: CirculationStatus }) {
  return <Badge variant={CIRCULATION_STATUS_VARIANT[status]}>{CIRCULATION_STATUS_LABEL[status]}</Badge>;
}

export function DueBadge({ dueDate }: { dueDate: string }) {
  const info = dueUrgency(dueDate);
  return <Badge variant={info.badgeVariant}>{info.label}</Badge>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-medium text-text-primary">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
