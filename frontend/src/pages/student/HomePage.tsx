// frontend/src/pages/student/HomePage.tsx
// Student home: greeting, three stat cards, an eligibility banner if blocked, a
// prominent "your requests" section for live reservations, a "due soon" list of
// the most urgent loans, and a search CTA for first-timers.
import { Link } from 'react-router-dom';
import { BookMarked, Clock, CircleDollarSign, Search, AlertTriangle } from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { StatCard } from '@/components/ui/stat-card';
import { SkeletonStat, SkeletonList } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { BookCover, DueBadge, ReservationStatusCard } from '@/components/shared';
import { toast } from '@/components/ui/toast';
import { useMe, useMyLoans, useMyReservations, useMyEligibility, useCancelReservation } from '@/hooks/api';
import { formatGhs } from '@/lib/format';
import { apiErrorMessage } from '@/lib/api';

export function StudentHomePage() {
  const me = useMe();
  const loans = useMyLoans();
  const reservations = useMyReservations();
  const eligibility = useMyEligibility();
  const cancelReservation = useCancelReservation();

  const activeLoans = (loans.data ?? []).filter((l) => !l.returned_at);
  const dueSoon = [...activeLoans]
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  // Live = still needs the student's attention (a pending pickup or queue spot).
  // COLLECTED has become a Loan and CANCELLED is gone, so both are excluded here.
  const liveReservations = (reservations.data ?? []).filter(
    (r) => r.status === 'WAITING' || r.status === 'READY'
  );
  const readyCount = liveReservations.filter((r) => r.status === 'READY').length;

  const onCancelReservation = async (id: string) => {
    try {
      await cancelReservation.mutateAsync(id);
      toast.success('Request cancelled');
    } catch (err) {
      toast.error('Could not cancel', apiErrorMessage(err));
    }
  };

  const loading = me.isLoading || loans.isLoading;
  const finesTotal = me.data?.outstandingFineTotal ?? 0;

  return (
    <PageTransition>
      {/* The greeting itself now lives in the persistent top strip (see
          StudentLayout.tsx) - it used to be repeated here as an <h1>. */}
      <p className="mb-6 text-sm text-text-secondary">Here's what's happening with your library account.</p>

      {/* Eligibility banner */}
      {eligibility.data && !eligibility.data.eligible && (
        <Card className="mb-6 border-warning-bg bg-warning-bg/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-text" />
            <div>
              <p className="text-sm font-medium text-warning-text">Borrowing is currently paused</p>
              <p className="mt-0.5 text-sm text-text-secondary">{eligibility.data.reason}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Your requests - the most time-sensitive thing on this page: a READY
          reservation has a 24h pickup window, so it gets top billing, not just a
          number in a stat card. */}
      {!reservations.isLoading && liveReservations.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-text-primary">
            {readyCount > 0 ? 'Ready for pickup' : 'Your requests'}
          </h2>
          <div className="space-y-2">
            {liveReservations.map((r) => (
              <ReservationStatusCard
                key={r.id}
                reservation={r}
                onCancel={onCancelReservation}
                cancelling={cancelReservation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <StatCard label="Active loans" value={activeLoans.length} icon={<BookMarked className="h-4 w-4" />} />
            <StatCard
              label="Active requests"
              value={liveReservations.length}
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              label="Fines due"
              value={finesTotal}
              prefix="GHS "
              decimals={2}
              tone={finesTotal > 0 ? 'error' : 'default'}
              icon={<CircleDollarSign className="h-4 w-4" />}
            />
          </>
        )}
      </div>

      {/* Due soon */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-text-primary">Due soon</h2>
        {loans.isLoading ? (
          <SkeletonList rows={3} cols={3} />
        ) : loans.isError ? (
          <ErrorState onRetry={() => loans.refetch()} />
        ) : dueSoon.length === 0 ? (
          <EmptyState
            title="No active loans"
            description="Find your next read in the catalog."
            icon={<Search className="h-6 w-6" />}
            action={
              <Button asChild>
                <Link to="/student/search">Search the catalog</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {dueSoon.map((loan) => (
              <Card key={loan.id} className="flex items-center gap-4 p-3">
                <div className="h-14 w-10 shrink-0">
                  <BookCover item={loan.copy!.catalog_item} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {loan.copy?.catalog_item.title}
                  </p>
                  <p className="truncate text-xs text-text-secondary">{loan.copy?.catalog_item.author}</p>
                </div>
                <DueBadge dueDate={loan.due_date} />
              </Card>
            ))}
            <div className="pt-1">
              <Button variant="ghost" asChild>
                <Link to="/student/loans">View all loans</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      {finesTotal > 0 && (
        <p className="mt-6 text-sm text-text-secondary">
          You owe {formatGhs(finesTotal)}.{' '}
          <Link to="/student/account" className="font-medium text-primary hover:underline">
            Pay your fines
          </Link>{' '}
          to keep borrowing.
        </p>
      )}
    </PageTransition>
  );
}
