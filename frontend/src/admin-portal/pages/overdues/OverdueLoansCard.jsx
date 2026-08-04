// src/admin-portal/pages/overdues/OverdueLoansCard.jsx
// Loans currently overdue and NOT YET RETURNED - no fine exists for these
// yet (fines are only posted on a late return, see
// backend/src/modules/circulation/circulation.service.ts's returnByBarcode).
// Severity here is a magnitude (days late), so it renders as SeverityMeter,
// never Badge - see that component's header comment for why the shapes must
// differ.
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loansService } from '../../services/loansService';
import { useApiList } from '../../hooks/useApiList';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { SeverityMeter } from '../../components/common/SeverityMeter';
import { RowActions } from '../../components/common/RowActions';
import { dueUrgency } from '../../utils/formatDate';

const PAGE_SIZE = 20;

// Widths sum to 100% - table-layout: fixed (components.css) splits any
// column with no explicit width evenly among its siblings instead of by
// what it actually needs.
export function OverdueLoansCard() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { rows, meta, status, errorMessage, refetch } = useApiList(
    ['circulation', 'loans', 'overdue'],
    loansService.list,
    { page, limit: PAGE_SIZE, overdue: true }
  );

  // A Loan has no independent GET /circulation/loans/:id endpoint, so the
  // detail page (LoanDetailPage, owned by another agent) reads the row via
  // router state instead of re-fetching it - the full row is handed along
  // on navigation.
  function openLoan(row) {
    navigate(`/admin/loans/${row.id}`, { state: { loan: row } });
  }

  const columns = useMemo(
    () => [
      { key: 'title', header: 'Title', accessor: (row) => row.copy.catalog_item.title, sortable: true, truncate: true, width: '24%' },
      { key: 'borrower', header: 'Borrower', accessor: (row) => row.user.name, sortable: true, truncate: true, width: '18%' },
      {
        key: 'severity',
        header: 'Days overdue',
        sortable: true,
        sortValue: (row) => Math.abs(dueUrgency(row.due_date).days ?? 0),
        render: (row) => <SeverityMeter daysLate={Math.abs(dueUrgency(row.due_date).days ?? 0)} />,
        width: '32%', // "30d late · Critical" plus the tick meter needs real room
      },
      { key: 'renewal_count', header: 'Renewals', numeric: true, accessor: (row) => row.renewal_count, width: '12%' },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => <RowActions onView={() => openLoan(row)} />,
        width: '14%',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <TableCard title="Overdue loans" description="Not yet returned; a fine is posted only once the book comes back.">
      <DataTable
        columns={columns}
        data={rows}
        status={status}
        errorMessage={errorMessage}
        onRetry={refetch}
        emptyProps={{ title: 'No overdue loans', description: 'Everything currently out is within its due date.' }}
        onRowClick={openLoan}
        rowAriaLabel={(row) => `Open loan for ${row.copy.catalog_item.title}`}
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={meta?.total}
        onPageChange={setPage}
      />
    </TableCard>
  );
}
