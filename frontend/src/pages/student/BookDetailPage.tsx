// frontend/src/pages/student/BookDetailPage.tsx
// Book detail + the borrow action area. The loan period is read from the
// API field (never hardcoded). Borrowing is a single unified action: the backend
// either hands over a copy immediately (READY) or queues the student (WAITING) -
// there's no separate "reserve" flow anymore.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { AvailabilityBadge, BookCover, ReservationStatusCard } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { useCatalogItem, useCreateReservation, useMyReservations, useCancelReservation } from '@/hooks/api';
import { apiErrorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import type { Reservation } from '@/lib/types';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const item = useCatalogItem(id);
  const reservations = useMyReservations();
  const reserve = useCreateReservation();
  const cancel = useCancelReservation();

  // Immediate feedback from the mutation response, shown until useMyReservations'
  // cache-invalidation refetch catches up (avoids a flash of "no active request").
  const [justCreated, setJustCreated] = useState<Reservation | null>(null);

  if (item.isLoading) {
    return (
      <PageTransition>
        <div className="flex gap-8">
          <Skeleton className="h-72 w-48" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </PageTransition>
    );
  }
  if (item.isError || !item.data) {
    return (
      <PageTransition>
        <ErrorState message="This book could not be loaded." onRetry={() => item.refetch()} />
      </PageTransition>
    );
  }

  const book = item.data;

  // An existing live request for this title, if any - server data wins once it
  // arrives, falling back to the just-created reservation in the meantime.
  const fromServer = (reservations.data ?? []).find(
    (r) => r.catalog_item_id === book.id && (r.status === 'WAITING' || r.status === 'READY')
  );
  const existing = fromServer ?? (justCreated?.catalog_item_id === book.id ? justCreated : null);

  const onBorrow = async () => {
    try {
      const res = await reserve.mutateAsync(book.id);
      const created = res.data?.data as Reservation;
      setJustCreated(created);
      if (created.status === 'READY') {
        toast.success('Ready for pickup', `Pick up by ${formatDateTime(created.expires_at)}.`);
      } else {
        toast.success("You're in line", `#${created.queue_position} in line — we'll notify you when it's ready.`);
      }
    } catch (err) {
      toast.error('Could not borrow', apiErrorMessage(err));
    }
  };

  const onCancel = async (reservationId: string) => {
    try {
      await cancel.mutateAsync(reservationId);
      setJustCreated(null);
      toast.success('Request cancelled');
    } catch (err) {
      toast.error('Could not cancel', apiErrorMessage(err));
    }
  };

  return (
    <PageTransition>
      <Link
        to="/student/search"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
        <div className="mx-auto h-72 w-48 md:mx-0">
          <BookCover item={book} className="shadow-sm" />
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-medium text-text-primary">{book.title}</h1>
              <p className="mt-1 text-sm text-text-secondary">{book.author}</p>
            </div>
            <AvailabilityBadge available={book.available_copies} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {book.subject_tags.map((tag) => (
              <Badge key={tag} variant="info">
                {tag}
              </Badge>
            ))}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:max-w-md">
            {book.publisher && (
              <div>
                <dt className="text-text-secondary">Publisher</dt>
                <dd className="text-text-primary">{book.publisher}</dd>
              </div>
            )}
            {book.year && (
              <div>
                <dt className="text-text-secondary">Year</dt>
                <dd className="text-text-primary">{book.year}</dd>
              </div>
            )}
            {book.isbn && (
              <div>
                <dt className="text-text-secondary">ISBN</dt>
                <dd className="text-text-primary">{book.isbn}</dd>
              </div>
            )}
            <div>
              <dt className="text-text-secondary">Loan period</dt>
              <dd className="text-text-primary">{book.loan_period_days ?? 14}-day loan</dd>
            </div>
          </dl>

          {book.shelf_location && (
            <Card className="mt-5 inline-flex items-center gap-2 px-3 py-2 text-sm text-text-primary">
              <MapPin className="h-4 w-4 text-primary" /> Shelf {book.shelf_location}
            </Card>
          )}

          {/* Action area: a button to borrow, or - if the student already has a
              live request on this title - its current status instead. */}
          <div className="mt-8">
            {existing ? (
              <ReservationStatusCard
                reservation={existing}
                onCancel={onCancel}
                cancelling={cancel.isPending}
                showCover={false}
              />
            ) : (
              <Button size="lg" variant="primary" loading={reserve.isPending} onClick={onBorrow}>
                Borrow
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
