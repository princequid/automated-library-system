// src/admin-portal/pages/reports/ReportsPage.jsx
// Same analytics endpoints as Dashboard, but with an explicit date range
// (loanVolume/overdueRate/topBorrowed all accept from/to - see
// backend/src/modules/analytics/analytics.routes.ts) and a client-side CSV
// export, since there's no server-side export endpoint.
import { lazy, Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { reportsService } from '../../services/reportsService';
import { useCssVars } from '../../hooks/useCssVars';
import { downloadCsv } from '../../utils/exportCsv';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { DownloadIcon } from '../../components/common/Icons';

const LoanVolumeChart = lazy(() => import('../../components/charts/LoanVolumeChart').then((m) => ({ default: m.LoanVolumeChart })));
const OverdueRateChart = lazy(() => import('../../components/charts/OverdueRateChart').then((m) => ({ default: m.OverdueRateChart })));

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function ReportsPage() {
  const [from, setFrom] = useState(isoDaysAgo(30));
  const [to, setTo] = useState(isoDaysAgo(0));
  const vars = useCssVars(['--color-primary', '--color-danger-text', '--color-border', '--color-text-3', '--color-white']);

  const loanVolumeQuery = useQuery({ queryKey: ['analytics', 'loan-volume', from, to], queryFn: () => reportsService.loanVolume({ from, to }) });
  const overdueRateQuery = useQuery({ queryKey: ['analytics', 'overdue-rate', from, to], queryFn: () => reportsService.overdueRate({ from, to }) });
  const topBorrowedQuery = useQuery({ queryKey: ['analytics', 'top-borrowed', from, to], queryFn: () => reportsService.topBorrowed({ from, to }) });
  const deptQuery = useQuery({ queryKey: ['analytics', 'borrowing-by-dept'], queryFn: () => reportsService.borrowingByDept() });

  function exportLoanVolume() {
    downloadCsv(`loan-volume_${from}_to_${to}.csv`, [
      { label: 'Day', value: (r) => new Date(r.day).toISOString().slice(0, 10) },
      { label: 'Loans issued', value: (r) => r.count },
    ], loanVolumeQuery.data?.data ?? []);
  }
  function exportTopBorrowed() {
    downloadCsv(`top-borrowed_${from}_to_${to}.csv`, [
      { label: 'Title', value: (r) => r.title },
      { label: 'Author', value: (r) => r.author },
      { label: 'Loans', value: (r) => r.count },
    ], topBorrowedQuery.data?.data ?? []);
  }
  function exportDept() {
    downloadCsv('borrowing-by-department.csv', [
      { label: 'Department', value: (r) => r.department },
      { label: 'Loans', value: (r) => r.count },
    ], deptQuery.data?.data ?? []);
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Circulation trends over a date range."
        actions={
          <div className="reports-date-range">
            <label>
              From
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={to} min={from} max={isoDaysAgo(0)} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
        }
      />

      <TableCard
        title="Loan volume"
        actions={
          <Button size="sm" variant="outline" onClick={exportLoanVolume} disabled={!loanVolumeQuery.data?.data?.length}>
            <DownloadIcon size={14} /> Export CSV
          </Button>
        }
      >
        {loanVolumeQuery.isPending && <LoadingState label="Loading…" />}
        {loanVolumeQuery.isError && <ErrorState message={apiErrorMessage(loanVolumeQuery.error)} onRetry={loanVolumeQuery.refetch} />}
        {loanVolumeQuery.isSuccess && (loanVolumeQuery.data?.data?.length ?? 0) === 0 && <EmptyState title="No data in this range" />}
        {(loanVolumeQuery.data?.data?.length ?? 0) > 0 && (
          <Suspense fallback={<LoadingState label="Rendering chart…" />}>
            <LoanVolumeChart
              data={loanVolumeQuery.data.data}
              stroke={vars['--color-primary']}
              gridColor={vars['--color-border']}
              textColor={vars['--color-text-3']}
              surfaceColor={vars['--color-white']}
            />
          </Suspense>
        )}
      </TableCard>

      <TableCard title="Overdue rate">
        {overdueRateQuery.isPending && <LoadingState label="Loading…" />}
        {overdueRateQuery.isError && <ErrorState message={apiErrorMessage(overdueRateQuery.error)} onRetry={overdueRateQuery.refetch} />}
        {overdueRateQuery.isSuccess && (overdueRateQuery.data?.data?.length ?? 0) === 0 && <EmptyState title="No data in this range" />}
        {(overdueRateQuery.data?.data?.length ?? 0) > 0 && (
          <Suspense fallback={<LoadingState label="Rendering chart…" />}>
            <OverdueRateChart
              data={overdueRateQuery.data.data}
              stroke={vars['--color-danger-text']}
              gridColor={vars['--color-border']}
              textColor={vars['--color-text-3']}
              surfaceColor={vars['--color-white']}
            />
          </Suspense>
        )}
      </TableCard>

      <TableCard
        title="Top borrowed titles"
        actions={
          <Button size="sm" variant="outline" onClick={exportTopBorrowed} disabled={!topBorrowedQuery.data?.data?.length}>
            <DownloadIcon size={14} /> Export CSV
          </Button>
        }
      >
        {topBorrowedQuery.isPending && <LoadingState label="Loading…" />}
        {topBorrowedQuery.isError && <ErrorState message={apiErrorMessage(topBorrowedQuery.error)} onRetry={topBorrowedQuery.refetch} />}
        {topBorrowedQuery.isSuccess && (topBorrowedQuery.data?.data?.length ?? 0) === 0 && <EmptyState title="No loans in this range" />}
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

      <TableCard
        title="Borrowing by department"
        description="All-time, not scoped to the date range above."
        actions={
          <Button size="sm" variant="outline" onClick={exportDept} disabled={!deptQuery.data?.data?.length}>
            <DownloadIcon size={14} /> Export CSV
          </Button>
        }
      >
        {deptQuery.isPending && <LoadingState label="Loading…" />}
        {deptQuery.isError && <ErrorState message={apiErrorMessage(deptQuery.error)} onRetry={deptQuery.refetch} />}
        {deptQuery.isSuccess && (deptQuery.data?.data?.length ?? 0) === 0 && <EmptyState title="No loans yet" />}
        {(deptQuery.data?.data?.length ?? 0) > 0 && (
          <ul className="top-borrowed-list">
            {deptQuery.data.data.map((row) => (
              <li key={row.department}>
                <span className="top-borrowed-title">{row.department}</span>
                <span className="top-borrowed-count">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </TableCard>
    </>
  );
}
