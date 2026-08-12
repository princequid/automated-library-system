// src/admin-portal/pages/reservations/ReservationsPage.jsx
// GET /reservations returns the full unpaginated array (no meta.total) - same
// shape as GET /fines, so this follows FinesCard.jsx's plain useQuery pattern
// rather than useApiList (which expects a paginated envelope).
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { reservationsService } from '../../services/reservationsService';
import { circulationService } from '../../services/circulationService';
import { catalogService } from '../../services/catalogService';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPills } from '../../components/common/FilterPills';
import { RowActions } from '../../components/common/RowActions';
import { Badge } from '../../components/common/Badge';
import { DueDate } from '../../components/common/DueDate';
import { useToast } from '../../components/common/Toast';

const STATUSES = ['WAITING', 'READY', 'EXPIRED', 'CANCELLED', 'COLLECTED'];
const STATUS_VARIANT = { WAITING: 'info', READY: 'success', EXPIRED: 'danger', CANCELLED: 'neutral', COLLECTED: 'neutral' };

function useCancelReservation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id) => reservationsService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reservation cancelled.');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not cancel this reservation.')),
  });
}

// A Reservation doesn't store which physical Copy was claimed for it (copies
// of the same title are fungible) - so handing over a READY reservation
// means looking up that title's copies, finding the one the READY
// reservation put on hold (status RESERVED), and issuing exactly that copy
// to the student. POST /circulation/issue then auto-flips the matching
// READY reservation to COLLECTED and creates the Loan server-side (same
// endpoint the desk Issue panel uses - see IssuePanel.jsx).
function useHandOverReservation() {
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (row) => {
      const copiesEnvelope = await catalogService.listCopies(row.catalog_item.id);
      const copies = copiesEnvelope?.data ?? [];
      const reservedCopy = copies.find((c) => c.status === 'RESERVED');
      if (!reservedCopy) {
        throw new Error('No reserved copy was found for this title - the hold may already have been collected or expired.');
      }
      return circulationService.issue({ copy_id: reservedCopy.id, user_id: row.user.id });
    },
    onSuccess: (_result, row) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['circulation', 'loans'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'items'] });
      toast.success(`${row.catalog_item.title} handed over to ${row.user.name}.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, err?.message || 'Could not hand over this book.')),
  });
}

export function ReservationsPage() {
  // Defaults to READY, not WAITING: the primary reason a Librarian opens
  // this page is "who's here to pick up a book", not "who's queued".
  const [status, setStatus] = useState('READY');
  const [search, setSearch] = useState('');
  const cancel = useCancelReservation();
  const handOver = useHandOverReservation();

  const query = useQuery({
    queryKey: ['reservations', 'list', status],
    queryFn: () => reservationsService.list({ status }),
  });
  const allRows = query.data?.data ?? [];
  // GET /reservations has no server-side search param, so filter the
  // already-loaded rows client-side (same spirit as other admin-portal
  // pages that lack server search).
  const rows = search
    ? allRows.filter((r) => r.user.name.toLowerCase().includes(search.toLowerCase()))
    : allRows;
  const dataStatus = query.isPending ? 'loading' : query.isError ? 'error' : 'success';

  const pillOptions = STATUSES.map((s) => ({ key: s, label: s.charAt(0) + s.slice(1).toLowerCase() }));

  const columns = [
    { key: 'title', header: 'Title', accessor: (row) => row.catalog_item.title, truncate: true, width: '25%' },
    { key: 'member', header: 'Member', accessor: (row) => row.user.name, truncate: true, width: '20%' },
    { key: 'position', header: 'Queue #', accessor: (row) => row.queue_position, numeric: true, width: '12%' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>,
      width: '13%',
    },
    {
      key: 'expires',
      header: 'Pickup by',
      // DueDate, not RelativeDate - this is a future deadline (pickup window),
      // not a past event, and RelativeDate rendered nonsense like "-1 days
      // ago" for a hold that's still open.
      render: (row) => (row.expires_at ? <DueDate value={row.expires_at} /> : '—'),
      width: '15%',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        if (row.status !== 'WAITING' && row.status !== 'READY') return null;
        const isHandingOverThisRow = handOver.isPending && handOver.variables?.id === row.id;
        return (
          <RowActions
            onView={
              row.status === 'READY'
                ? () => {
                    if (!handOver.isPending) handOver.mutate(row);
                  }
                : undefined
            }
            viewLabel={isHandingOverThisRow ? 'Handing over…' : 'Hand over'}
            menuItems={[
              {
                label: cancel.isPending && cancel.variables === row.id ? 'Cancelling…' : 'Cancel',
                onClick: () => cancel.mutate(row.id),
                danger: true,
              },
            ]}
          />
        );
      },
      width: '15%',
    },
  ];

  return (
    <>
      <PageHeader
        title="Reservations"
        description="Student borrow requests - some still waiting in the queue, others already set aside and ready for pickup at the desk."
      />

      <TableCard>
        <div className="table-toolbar">
          <SearchBar value={search} onSearch={setSearch} placeholder="Search by student name…" />
          <FilterPills options={pillOptions} active={status} onChange={setStatus} />
          <p className="filter-results-count">{rows.length} results</p>
        </div>
      </TableCard>

      <TableCard>
        <DataTable
          columns={columns}
          data={rows}
          status={dataStatus}
          errorMessage={query.error ? apiErrorMessage(query.error) : undefined}
          onRetry={query.refetch}
          emptyProps={{
            title: search ? `No ${status.toLowerCase()} reservations matching "${search}"` : `No ${status.toLowerCase()} reservations`,
            filtered: true,
          }}
        />
      </TableCard>
    </>
  );
}
