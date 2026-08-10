// src/admin-portal/pages/dashboard/LibrarianDashboardPage.jsx
// "Today's Library Operations" - the Librarian's dashboard (spec section 22).
// Circulation-flavored KPIs/charts (all already operational data, unchanged
// from the pre-split single Dashboard) plus a quick-actions row for the
// day-to-day tasks Librarian owns: issuing, returning, cataloguing,
// reservations, inventory, acquisitions. See AdministratorDashboardPage for
// the deliberately different governance-focused counterpart - this is not a
// smaller version of that page, it's a different tool.
import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { reportsService } from '../../services/reportsService';
import { useCssVars } from '../../hooks/useCssVars';
import { greetingLine } from '../../utils/greeting';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { KpiCard } from '../../components/common/KpiCard';
import { QuickActions } from '../../components/common/QuickActions';
import { LiveBadge } from '../../components/common/LiveBadge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { RelativeDate } from '../../components/common/RelativeDate';
import { DueDate } from '../../components/common/DueDate';
import {
  ActiveLoansIcon,
  OverduesIcon,
  FinesIcon,
  ItemsAddedIcon,
  CirculationIcon,
  CatalogueIcon,
  ReservationsIcon,
  InventoryIcon,
  AcquisitionsIcon,
} from '../../components/common/Icons';

const LIVE_REFRESH_MS = 30_000;

const LoanVolumeChart = lazy(() => import('../../components/charts/LoanVolumeChart').then((m) => ({ default: m.LoanVolumeChart })));
const OverdueRateChart = lazy(() => import('../../components/charts/OverdueRateChart').then((m) => ({ default: m.OverdueRateChart })));
const BorrowingByDeptChart = lazy(() =>
  import('../../components/charts/BorrowingByDeptChart').then((m) => ({ default: m.BorrowingByDeptChart }))
);

const CHART_VARS = ['--color-primary', '--color-danger-text', '--color-border', '--color-text-3', '--color-teal-text', '--color-info-text', '--color-warning-text', '--color-success-text', '--color-white'];

const QUICK_ACTIONS = [
  { label: 'Issue book', to: '/admin/circulation', icon: CirculationIcon },
  { label: 'Return book', to: '/admin/circulation', icon: CirculationIcon },
  { label: 'Add book', to: '/admin/catalogue', icon: CatalogueIcon },
  { label: 'Manage reservations', to: '/admin/reservations', icon: ReservationsIcon },
  { label: 'Inventory', to: '/admin/inventory', icon: InventoryIcon },
  { label: 'Acquisition', to: '/admin/acquisitions', icon: AcquisitionsIcon },
];

function ChartCard({ title, query, children }) {
  return (
    <TableCard title={title}>
      {query.isPending && <LoadingState label="Loading…" />}
      {query.isError && <ErrorState message={apiErrorMessage(query.error)} onRetry={query.refetch} />}
      {query.isSuccess && (query.data?.data?.length ?? 0) === 0 && <EmptyState title="No data yet" description="Nothing in this range." />}
      {query.isSuccess && (query.data?.data?.length ?? 0) > 0 && (
        <Suspense fallback={<LoadingState label="Rendering chart…" />}>{children}</Suspense>
      )}
    </TableCard>
  );
}

export function LibrarianDashboardPage() {
  const vars = useCssVars(CHART_VARS);
  const { user } = useAuthStore();

  const statsQuery = useQuery({
    queryKey: ['analytics', 'dashboard-stats'],
    queryFn: () => reportsService.dashboardStats(),
    refetchInterval: LIVE_REFRESH_MS,
  });
  const loanVolumeQuery = useQuery({
    queryKey: ['analytics', 'loan-volume'],
    queryFn: () => reportsService.loanVolume(),
    refetchInterval: LIVE_REFRESH_MS,
  });
  const overdueRateQuery = useQuery({
    queryKey: ['analytics', 'overdue-rate'],
    queryFn: () => reportsService.overdueRate(),
    refetchInterval: LIVE_REFRESH_MS,
  });
  const topBorrowedQuery = useQuery({ queryKey: ['analytics', 'top-borrowed'], queryFn: () => reportsService.topBorrowed() });
  const deptQuery = useQuery({ queryKey: ['analytics', 'borrowing-by-dept'], queryFn: () => reportsService.borrowingByDept() });
  const activityQuery = useQuery({
    queryKey: ['analytics', 'recent-activity'],
    queryFn: () => reportsService.recentActivity(),
    refetchInterval: LIVE_REFRESH_MS,
  });

  const stats = statsQuery.data?.data;
  const deptColors = [vars['--color-primary'], vars['--color-teal-text'], vars['--color-info-text'], vars['--color-warning-text'], vars['--color-success-text']];
  const overdueSparkline = overdueRateQuery.data?.data?.slice(-10).map((d) => d.overdue);

  return (
    <>
      <PageHeader
        title="Today's Library Operations"
        description={greetingLine(user?.name)}
        actions={<LiveBadge seconds={LIVE_REFRESH_MS / 1000} />}
      />

      <QuickActions items={QUICK_ACTIONS} />

      {statsQuery.isError && <ErrorState message={apiErrorMessage(statsQuery.error)} onRetry={statsQuery.refetch} />}

      {(statsQuery.isPending || statsQuery.isSuccess) && (
        <div className="kpi-grid-primary">
          <KpiCard
            label="Active loans"
            value={stats?.activeLoans}
            accent="primary"
            icon={ActiveLoansIcon}
            description="Currently checked out"
          />
          <KpiCard
            label="Overdue"
            value={stats?.overdueCount}
            accent="danger"
            icon={OverduesIcon}
            description="Not yet returned"
            sparkline={overdueSparkline}
          />
          <KpiCard
            label="Fines collected this month"
            value={stats?.finesCollectedThisMonth}
            precision={2}
            unit=" GHS"
            accent="success"
            icon={FinesIcon}
            description="Paid this month"
          />
          <KpiCard
            label="Items added this week"
            value={stats?.itemsAddedThisWeek}
            accent="info"
            icon={ItemsAddedIcon}
            description="New titles"
          />
        </div>
      )}

      <div className="dashboard-chart-grid">
        <ChartCard title="Loan volume (last 30 days)" query={loanVolumeQuery}>
          <LoanVolumeChart
            data={loanVolumeQuery.data?.data ?? []}
            stroke={vars['--color-primary']}
            gridColor={vars['--color-border']}
            textColor={vars['--color-text-3']}
            surfaceColor={vars['--color-white']}
          />
        </ChartCard>
        <ChartCard title="Overdue rate (last 30 days)" query={overdueRateQuery}>
          <OverdueRateChart
            data={overdueRateQuery.data?.data ?? []}
            stroke={vars['--color-danger-text']}
            gridColor={vars['--color-border']}
            textColor={vars['--color-text-3']}
            surfaceColor={vars['--color-white']}
          />
        </ChartCard>
      </div>

      <div className="dashboard-chart-grid">
        <ChartCard title="Borrowing by department" query={deptQuery}>
          <BorrowingByDeptChart data={deptQuery.data?.data ?? []} colors={deptColors} textColor={vars['--color-text-3']} />
        </ChartCard>

        <TableCard title="Top borrowed titles">
          {topBorrowedQuery.isPending && <LoadingState label="Loading…" />}
          {topBorrowedQuery.isError && <ErrorState message={apiErrorMessage(topBorrowedQuery.error)} onRetry={topBorrowedQuery.refetch} />}
          {topBorrowedQuery.isSuccess && (topBorrowedQuery.data?.data?.length ?? 0) === 0 && (
            <EmptyState title="No loans yet" description="Top titles will appear once loans are issued." />
          )}
          {(topBorrowedQuery.data?.data?.length ?? 0) > 0 && (
            <ol className="top-borrowed-list">
              {topBorrowedQuery.data.data.map((row, i) => (
                <li key={`${row.title}-${i}`}>
                  <span className="top-borrowed-rank">{i + 1}</span>
                  <span className="top-borrowed-title">{row.title}</span>
                  <span className="top-borrowed-count">{row.count}</span>
                </li>
              ))}
            </ol>
          )}
        </TableCard>
      </div>

      <TableCard title="Recent activity">
        {activityQuery.isPending && <LoadingState label="Loading…" />}
        {activityQuery.isError && <ErrorState message={apiErrorMessage(activityQuery.error)} onRetry={activityQuery.refetch} />}
        {activityQuery.isSuccess && (activityQuery.data?.data?.length ?? 0) === 0 && (
          <EmptyState title="No activity yet" description="Recent issues and returns will show up here." />
        )}
        {(activityQuery.data?.data?.length ?? 0) > 0 && (
          <ul className="recent-activity-list">
            {activityQuery.data.data.map((loan) => (
              <li key={loan.id}>
                <span className="recent-activity-title">{loan.copy.catalog_item.title}</span>
                <span className="recent-activity-borrower">{loan.user.name}</span>
                {loan.returned_at ? (
                  <span className="recent-activity-status">
                    Returned <RelativeDate value={loan.returned_at} />
                  </span>
                ) : (
                  <DueDate value={loan.due_date} className="recent-activity-status" />
                )}
              </li>
            ))}
          </ul>
        )}
      </TableCard>
    </>
  );
}
