// frontend/src/pages/student/MyLoansPage.tsx
// Active / Reserved / History with an animated tab underline. Renew and cancel
// actions with API-driven reasons and toast confirmations.
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { PageTransition } from '@/components/ui/page-transition';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { Tooltip } from '@/components/ui/tooltip';
import { BookCover, DueBadge, PageHeader, ReservationStatusCard } from '@/components/shared';
import { toast } from '@/components/ui/toast';
import { useMyLoans, useMyReservations, useRenewLoan, useCancelReservation } from '@/hooks/api';
import { apiErrorMessage } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Loan } from '@/lib/types';

type Tab = 'active' | 'reserved' | 'history';

export function MyLoansPage() {
  const [tab, setTab] = useState<Tab>('active');
  const loans = useMyLoans();
  const reservations = useMyReservations();
  const renew = useRenewLoan();
  const cancel = useCancelReservation();

  const active = (loans.data ?? []).filter((l) => !l.returned_at);
  const history = (loans.data ?? []).filter((l) => l.returned_at);
  // Live = still worth showing here; COLLECTED became a Loan (shows in Active/
  // History instead) and CANCELLED is gone, so both are excluded.
  const liveReservations = (reservations.data ?? []).filter(
    (r) => r.status === 'WAITING' || r.status === 'READY' || r.status === 'EXPIRED'
  );

  const historyByMonth = useMemo(() => {
    const groups: Record<string, Loan[]> = {};
    for (const l of history) {
      const key = format(new Date(l.returned_at!), 'MMMM yyyy');
      (groups[key] ??= []).push(l);
    }
    return groups;
  }, [history]);

  const onRenew = async (loan: Loan) => {
    try {
      await renew.mutateAsync(loan.id);
      toast.success('Renewed', loan.copy?.catalog_item.title);
    } catch (err) {
      toast.error('Could not renew', apiErrorMessage(err));
    }
  };

  const onCancel = async (id: string) => {
    try {
      await cancel.mutateAsync(id);
      toast.success('Reservation cancelled');
    } catch (err) {
      toast.error('Could not cancel', apiErrorMessage(err));
    }
  };

  return (
    <PageTransition>
      <PageHeader title="My loans" />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mb-5 overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="active" active={tab === 'active'} layoutGroup="loans-tab">
            Active ({active.length})
          </TabsTrigger>
          <TabsTrigger value="reserved" active={tab === 'reserved'} layoutGroup="loans-tab">
            Reserved ({liveReservations.length})
          </TabsTrigger>
          <TabsTrigger value="history" active={tab === 'history'} layoutGroup="loans-tab">
            History
          </TabsTrigger>
        </TabsList>

        {/* Active */}
        <TabsContent value="active">
          {loans.isLoading ? (
            <SkeletonList rows={3} cols={3} />
          ) : loans.isError ? (
            <ErrorState onRetry={() => loans.refetch()} />
          ) : active.length === 0 ? (
            <EmptyState title="No active loans" description="Borrowed books will appear here." />
          ) : (
            <div className="space-y-2">
              {active.map((loan) => {
                const renewable = loan.renewal_count < 2; // UI hint; backend is the source of truth
                return (
                  <Card key={loan.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:gap-4">
                    <div className="h-16 w-11 shrink-0">
                      <BookCover item={loan.copy!.catalog_item} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {loan.copy?.catalog_item.title}
                      </p>
                      <p className="truncate text-xs text-text-secondary">{loan.copy?.catalog_item.author}</p>
                    </div>
                    <DueBadge dueDate={loan.due_date} />
                    {renewable ? (
                      <Button variant="ghost" loading={renew.isPending} onClick={() => onRenew(loan)}>
                        Renew
                      </Button>
                    ) : (
                      <Tooltip label="This loan has reached its renewal limit">
                        <span>
                          <Button variant="ghost" disabled>
                            Renew
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Reserved */}
        <TabsContent value="reserved">
          {reservations.isLoading ? (
            <SkeletonList rows={2} cols={3} />
          ) : reservations.isError ? (
            <ErrorState onRetry={() => reservations.refetch()} />
          ) : liveReservations.length === 0 ? (
            <EmptyState title="No requests" description="Borrow a title to reserve or queue for it." />
          ) : (
            <div className="space-y-2">
              {liveReservations.map((res) => (
                <ReservationStatusCard key={res.id} reservation={res} onCancel={onCancel} cancelling={cancel.isPending} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          {loans.isLoading ? (
            <SkeletonList rows={4} cols={3} />
          ) : history.length === 0 ? (
            <EmptyState title="No history yet" description="Returned books will be listed here." />
          ) : (
            <div className="space-y-6">
              {Object.entries(historyByMonth).map(([month, group]) => (
                <div key={month}>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">
                    {month}
                  </h3>
                  <div className="space-y-2">
                    {group.map((loan) => (
                      <Card key={loan.id} className="flex items-center gap-4 p-3">
                        <div className="h-14 w-10 shrink-0">
                          <BookCover item={loan.copy!.catalog_item} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {loan.copy?.catalog_item.title}
                          </p>
                          <p className="truncate text-xs text-text-secondary">
                            Returned {formatDate(loan.returned_at)}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}
