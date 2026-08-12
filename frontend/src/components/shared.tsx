// frontend/src/components/shared.tsx
// Small presentational pieces reused across portals: a book cover placeholder, an
// availability badge, a due-date badge, and a page header.
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dueUrgency, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CatalogItem, Reservation } from '@/lib/types';

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

// ---- Reservation status ------------------------------------------------------
// A reservation is "live" (worth showing as a pending request) in exactly three
// states; COLLECTED has become a Loan and CANCELLED is gone, so callers should
// filter those out before rendering a list of these.
type LiveReservationStatus = 'WAITING' | 'READY' | 'EXPIRED';

const RESERVATION_BADGE_VARIANT: Record<LiveReservationStatus, 'info' | 'success' | 'neutral'> = {
  WAITING: 'info',
  READY: 'success',
  EXPIRED: 'neutral',
};

function reservationStatusText(reservation: Reservation): { label: string; detail: string } {
  switch (reservation.status) {
    case 'READY':
      return { label: 'Ready', detail: `Pick up by ${formatDateTime(reservation.expires_at)}` };
    case 'EXPIRED':
      return { label: 'Expired', detail: 'No longer held — the pickup window passed.' };
    case 'WAITING':
    default:
      return {
        label: `#${reservation.queue_position} in line`,
        detail: "We'll notify you the moment it's ready.",
      };
  }
}

/**
 * The one "which state is my request in right now" indicator, reused everywhere a
 * reservation surfaces: the book detail page's action area, Home's active-requests
 * section, and My Loans' Reserved tab. Keeping the WAITING/READY/EXPIRED wording
 * identical everywhere means it never contradicts what the notification bell says.
 */
export function ReservationStatusCard({
  reservation,
  onCancel,
  cancelling = false,
  showCover = true,
}: {
  reservation: Reservation;
  onCancel?: (id: string) => void;
  cancelling?: boolean;
  showCover?: boolean;
}) {
  const item = reservation.catalog_item;
  const status = reservation.status as LiveReservationStatus;
  const variant = RESERVATION_BADGE_VARIANT[status] ?? 'neutral';
  const { label, detail } = reservationStatusText(reservation);
  const cancellable = reservation.status === 'WAITING' || reservation.status === 'READY';

  return (
    <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showCover && item && (
          <div className="h-14 w-10 shrink-0">
            {/* Reservation payloads don't carry a cover_url, so this always renders
                the placeholder icon - fine, since list rows are small anyway. */}
            <BookCover item={{ title: item.title, cover_url: null }} />
          </div>
        )}
        {item && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text-primary">{item.title}</p>
            <p className="truncate text-xs text-text-secondary">{item.author}</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
        <div className="flex flex-col items-start gap-1 sm:items-end sm:text-right">
          <Badge variant={variant}>{label}</Badge>
          <span className="text-[11px] leading-snug text-text-secondary">{detail}</span>
        </div>
        {onCancel && cancellable && (
          <Button
            variant="ghost"
            size="sm"
            loading={cancelling}
            onClick={() => onCancel(reservation.id)}
            className="shrink-0"
          >
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}
