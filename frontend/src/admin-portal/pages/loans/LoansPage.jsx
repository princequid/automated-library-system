// src/admin-portal/pages/loans/LoansPage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loansService } from '../../services/loansService';
import { useApiList } from '../../hooks/useApiList';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { FilterPills } from '../../components/common/FilterPills';
import { RowActions } from '../../components/common/RowActions';
import { LoanStatusBadge } from '../../components/common/Badge';
import { DueDate } from '../../components/common/DueDate';
import { RelativeDate } from '../../components/common/RelativeDate';
import { deriveLoanStatus } from '../../utils/loanStatus';
import { useLoanActions } from './useLoanActions';

const PAGE_SIZE = 20;
const STATUS_RANK = { OVERDUE: 0, ACTIVE: 1, RETURNED: 2 };

function LoanRowActions({ loan, onView }) {
  const { renew, returnLoan } = useLoanActions(loan);
  const isActive = !loan.returned_at;

  return (
    <RowActions
      onView={onView}
      menuItems={
        isActive
          ? [
              { label: renew.isPending ? 'Renewing…' : 'Renew', onClick: () => renew.mutate() },
              { label: returnLoan.isPending ? 'Returning…' : 'Return', onClick: () => returnLoan.mutate() },
            ]
          : []
      }
    />
  );
}

// Widths sum to 100% - table-layout: fixed (components.css) splits any
// column with no explicit width evenly among its siblings. Barcode, Issued
// date, and Renewal count moved to LoanDetailPage.jsx so this stops
// cramming 8 columns into one row.
const COLUMNS = [
  { key: 'title', header: 'Title', accessor: (row) => row.copy.catalog_item.title, sortable: true, truncate: true, width: '30%' },
  { key: 'borrower', header: 'Borrower', accessor: (row) => row.user.name, sortable: true, truncate: true, width: '22%' },
  {
    key: 'due_date',
    header: 'Due',
    sortable: true,
    sortValue: (row) => new Date(row.due_date).getTime(),
    render: (row) => (row.returned_at ? <RelativeDate value={row.returned_at} /> : <DueDate value={row.due_date} />),
    width: '20%',
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    sortValue: (row) => STATUS_RANK[deriveLoanStatus(row)],
    render: (row) => <LoanStatusBadge status={deriveLoanStatus(row)} />,
    width: '13%',
  },
];

export function LoansPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Only "All" and "Overdue" are real, backend-backed counts (the `overdue`
  // query param is the only filter loansQuery actually supports) - no
  // "Active"/"Returned" pills, since those totals aren't derivable from any
  // real request without guessing.
  const allCountQuery = useQuery({ queryKey: ['circulation', 'loans', 'count', 'all'], queryFn: () => loansService.list({ limit: 1 }) });
  const overdueCountQuery = useQuery({
    queryKey: ['circulation', 'loans', 'count', 'overdue'],
    queryFn: () => loansService.list({ limit: 1, overdue: true }),
  });
  const pillOptions = [
    { key: 'all', label: 'All', count: allCountQuery.data?.meta?.total },
    { key: 'overdue', label: 'Overdue', count: overdueCountQuery.data?.meta?.total },
  ];

  const { rows, meta, status, errorMessage, refetch } = useApiList(
    ['circulation', 'loans'],
    loansService.list,
    { page, limit: PAGE_SIZE, overdue: overdueOnly || undefined }
  );

  function openLoan(row) {
    // A Loan has no independent GET /circulation/loans/:id endpoint - the
    // detail page reads the row via router state instead of re-fetching it.
    navigate(`/admin/loans/${row.id}`, { state: { loan: row } });
  }

  const columns = [
    ...COLUMNS,
    { key: 'actions', header: 'Actions', render: (row) => <LoanRowActions loan={row} onView={() => openLoan(row)} />, width: '15%' },
  ];

  return (
    <>
      <PageHeader title="Loans" description="Every active and past loan on record." />

      <TableCard>
        <div className="table-toolbar">
          <FilterPills
            options={pillOptions}
            active={overdueOnly ? 'overdue' : 'all'}
            onChange={(key) => { setOverdueOnly(key === 'overdue'); setPage(1); }}
          />
          <p className="filter-results-count">{typeof meta?.total === 'number' ? `${meta.total} results` : ' '}</p>
        </div>
      </TableCard>

      <TableCard>
        <DataTable
          columns={columns}
          data={rows}
          status={status}
          errorMessage={errorMessage}
          onRetry={refetch}
          emptyProps={{ filtered: overdueOnly, title: overdueOnly ? 'No overdue loans' : 'No loans yet' }}
          onRowClick={openLoan}
          rowAriaLabel={(row) => `Open loan for ${row.copy.catalog_item.title}`}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={meta?.total}
          onPageChange={setPage}
        />
      </TableCard>
    </>
  );
}
