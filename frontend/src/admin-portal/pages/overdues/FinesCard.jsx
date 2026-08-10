// src/admin-portal/pages/overdues/FinesCard.jsx
import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { apiErrorMessage } from '@/lib/api';
import { finesService } from '../../services/finesService';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { FilterPills } from '../../components/common/FilterPills';
import { RowActions } from '../../components/common/RowActions';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { OverrideReasonModal } from '../../components/common/OverrideReasonModal';
import { BulkWaiveModal } from './BulkWaiveModal';
import { WaiveFineModal } from './WaiveFineModal';

const PAGE_SIZE = 10;

// GET /fines has no pagination - it always returns the full matching array,
// so .data.length on a filtered response IS the true total for that filter,
// not just a page. Real, backend-derived counts, one request per pill.
const PILLS = [
  { key: 'unresolved', label: 'Unresolved', params: { paid: false, waived: false } },
  { key: 'disputed', label: 'Disputed', params: { disputed: true } },
  { key: 'paid', label: 'Paid', params: { paid: true } },
  { key: 'waived', label: 'Waived', params: { waived: true } },
  { key: 'all', label: 'All', params: {} },
];

function useFinePillCounts() {
  const results = useQueries({
    queries: PILLS.map((p) => ({ queryKey: ['fines', 'count', p.key], queryFn: () => finesService.list(p.params) })),
  });
  return Object.fromEntries(PILLS.map((p, i) => [p.key, results[i].data?.data?.length]));
}

export function FinesCard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  // waive/pay-manual are requireLibrarianOrOverride() on the backend - both
  // roles reach these, but ADMINISTRATOR must supply an override_reason.
  const canWaive = rankAtLeast(user?.role, 'LIBRARIAN');
  const canRecordPayment = rankAtLeast(user?.role, 'LIBRARIAN');
  const isAdministrator = user?.role === 'ADMINISTRATOR';
  const queryClient = useQueryClient();
  const toast = useToast();

  const payManual = useMutation({
    mutationFn: ({ id, overrideReason }) =>
      finesService.payManual(id, overrideReason ? { override_reason: overrideReason } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      toast.success('Payment recorded.');
      setOverridingPayment(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not record this payment.')),
  });

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('unresolved');
  const [selected, setSelected] = useState(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [waivingFine, setWaivingFine] = useState(null);
  const [overridingPayment, setOverridingPayment] = useState(null);

  const counts = useFinePillCounts();
  const pillOptions = PILLS.map((p) => ({ key: p.key, label: p.label, count: counts[p.key] }));
  const activePills = PILLS.find((p) => p.key === filter);

  const query = useQuery({
    queryKey: ['fines', 'list', filter],
    queryFn: () => finesService.list(activePills.params),
  });
  const status = query.isPending ? 'loading' : query.isError ? 'error' : 'success';
  const allFines = query.data?.data ?? [];

  function openFine(row) {
    // A Fine has no independent GET /fines/:id endpoint - the detail page
    // reads the row via router state instead of re-fetching it.
    navigate(`/admin/overdues/fines/${row.id}`, { state: { fine: row } });
  }

  const columns = useMemo(
    () => [
      {
        key: 'user',
        header: 'Member',
        accessor: (row) => row.user.name,
        sortable: true,
        truncate: true,
        width: '24%',
      },
      {
        key: 'reason',
        header: 'Reason',
        truncate: true,
        width: '32%',
        render: (row) => (
          <span>
            {row.disputed && (
              <span style={{ marginRight: 'var(--space-2)', display: 'inline-block' }}>
                <Badge variant="warning">Disputed</Badge>
              </span>
            )}
            {row.reason}
          </span>
        ),
      },
      {
        key: 'amount',
        header: 'Amount (GHS)',
        numeric: true,
        sortable: true,
        sortValue: (row) => Number(row.amount),
        render: (row) => Number(row.amount).toFixed(2),
        width: '18%',
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => {
          const unresolved = !row.paid && !row.waived;
          const menuItems = [];
          if (canWaive && unresolved) menuItems.push({ label: 'Waive', onClick: () => setWaivingFine(row) });
          if (canRecordPayment && unresolved && !row.disputed) {
            menuItems.push({
              label: 'Record payment',
              onClick: () => (isAdministrator ? setOverridingPayment(row) : payManual.mutate({ id: row.id })),
            });
          }
          return <RowActions onView={() => openFine(row)} menuItems={menuItems} />;
        },
        width: '26%',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canWaive, canRecordPayment, isAdministrator]
  );

  const selectedFines = allFines.filter((f) => selected.has(f.id));

  return (
    <TableCard title="Fines" description="Posted fines - unpaid, paid, and waived.">
      <div className="table-toolbar">
        <FilterPills options={pillOptions} active={filter} onChange={(key) => { setFilter(key); setPage(1); setSelected(new Set()); }} />
        <div className="fines-toolbar-row">
          <p className="filter-results-count">{allFines.length} results</p>
          {canWaive && selected.size > 0 && (
            <Button size="sm" onClick={() => setBulkOpen(true)}>
              Waive {selected.size} selected
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={allFines}
        status={status}
        errorMessage={query.error ? apiErrorMessage(query.error) : undefined}
        onRetry={query.refetch}
        emptyProps={{ title: `No ${filter === 'all' ? '' : filter + ' '}fines`, filtered: filter !== 'all' }}
        onRowClick={openFine}
        rowAriaLabel={(row) => `Open fine for ${row.user.name}`}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        selection={
          canWaive
            ? {
                selected,
                onToggle: (id) =>
                  setSelected((prev) => {
                    const next = new Set(prev);
                    next.has(id) ? next.delete(id) : next.add(id);
                    return next;
                  }),
                onToggleAll: (ids) =>
                  setSelected((prev) => {
                    const allSelected = ids.every((id) => prev.has(id));
                    if (allSelected) {
                      const next = new Set(prev);
                      ids.forEach((id) => next.delete(id));
                      return next;
                    }
                    return new Set([...prev, ...ids]);
                  }),
              }
            : undefined
        }
      />

      {canWaive && (
        <>
          <BulkWaiveModal
            open={bulkOpen}
            onClose={() => {
              setBulkOpen(false);
              setSelected(new Set());
            }}
            fines={selectedFines}
          />
          <WaiveFineModal open={!!waivingFine} onClose={() => setWaivingFine(null)} fine={waivingFine} />
        </>
      )}

      {canRecordPayment && isAdministrator && (
        <OverrideReasonModal
          open={!!overridingPayment}
          onClose={() => setOverridingPayment(null)}
          title="Record payment"
          description={
            overridingPayment &&
            `Recording GHS ${Number(overridingPayment.amount).toFixed(2)} as paid for ${overridingPayment.user.name}. This is normally a Librarian action, so the reason is recorded as an override.`
          }
          onConfirm={(reason) => payManual.mutate({ id: overridingPayment.id, overrideReason: reason })}
          loading={payManual.isPending}
        />
      )}
    </TableCard>
  );
}
