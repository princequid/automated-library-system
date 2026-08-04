// frontend/src/pages/student/BookDetailPage.tsx
// Book detail + the borrow/reserve action area. The loan period is read from the
// API field (never hardcoded). Eligibility gates the borrow button and shows the
// exact backend reason text when blocked.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';
import { PageTransition, DrawnCheck } from '@/components/ui/page-transition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { AvailabilityBadge, BookCover } from '@/components/shared';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import {
  useCatalogItem,
  useMyEligibility,
  useSelfBorrow,
  useCreateReservation,
} from '@/hooks/api';
import { apiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const item = useCatalogItem(id);
  const eligibility = useMyEligibility();
  const borrow = useSelfBorrow();
  const reserve = useCreateReservation();

  const [borrowed, setBorrowed] = useState<{ dueDate: string } | null>(null);
  const [reserved, setReserved] = useState<{ position: number } | null>(null);

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
  const firstAvailableCopy = book.copies?.find((c) => c.status === 'AVAILABLE');
  const canBorrow = book.available_copies > 0 && eligibility.data?.eligible;

  const onBorrow = async () => {
    if (!firstAvailableCopy) return;
    try {
      const res = await borrow.mutateAsync(firstAvailableCopy.id);
      const dueDate = res.data?.data?.due_date as string;
      setBorrowed({ dueDate });
      toast.success('Borrowed', book.title);
    } catch (err) {
      toast.error('Could not borrow', apiErrorMessage(err));
    }
  };

  const onReserve = async () => {
    try {
      const res = await reserve.mutateAsync(book.id);
      const position = res.data?.data?.queue_position as number;
      setReserved({ position });
      toast.success('Reserved', `You are #${position} in the queue.`);
    } catch (err) {
      toast.error('Could not reserve', apiErrorMessage(err));
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

          {/* Action area */}
          <div className="mt-8">
            {borrowed ? (
              <Card className="flex items-center gap-4 border-success-bg bg-success-bg/40 p-5">
                <DrawnCheck />
                <div>
                  <p className="text-sm font-medium text-success-text">Borrowed successfully</p>
                  <p className="mt-0.5 text-sm text-text-secondary">Due {formatDate(borrowed.dueDate)}</p>
                  <Button variant="ghost" className="mt-2 px-0" asChild>
                    <Link to="/student/loans">View my loans</Link>
                  </Button>
                </div>
              </Card>
            ) : reserved ? (
              <Card className="border-primary/30 bg-primary-tint/50 p-5">
                <p className="text-sm font-medium text-primary-hover">Reserved</p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  You are #{reserved.position} in the queue. We'll notify you when it's ready.
                </p>
              </Card>
            ) : book.available_copies > 0 ? (
              canBorrow ? (
                <Button size="lg" loading={borrow.isPending} onClick={onBorrow}>
                  Borrow now
                </Button>
              ) : (
                <div>
                  <Button size="lg" disabled>
                    Borrow now
                  </Button>
                  {eligibility.data?.reason && (
                    <p className="mt-2 text-sm text-error-text">
                      {eligibility.data.reason}{' '}
                      {eligibility.data.reason.toLowerCase().includes('fine') && (
                        <Link to="/student/account" className="font-medium underline">
                          Go to account
                        </Link>
                      )}
                    </p>
                  )}
                </div>
              )
            ) : (
              <Button size="lg" variant="secondary" loading={reserve.isPending} onClick={onReserve}>
                Reserve
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
