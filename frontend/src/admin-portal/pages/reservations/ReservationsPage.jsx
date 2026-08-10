// src/admin-portal/pages/reservations/ReservationsPage.jsx
// GET /reservations returns the full unpaginated array (no meta.total) - same
// shape as GET /fines, so this follows FinesCard.jsx's plain useQuery pattern
// rather than useApiList (which expects a paginated envelope).
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { reservationsService } from '../../services/reservationsService';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { FilterPills } from '../../components/common/FilterPills';
import { RowActions } from '../../components/common/RowActions';
import { Badge } from '../../components/common/Badge';
import { RelativeDate } from '../../components/common/RelativeDate';
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

export function ReservationsPage() {
  const [status, setStatus] = useState('WAITING');
  const cancel = useCancelReservation();

  const query = useQuery({
    queryKey: ['reservations', 'list', status],
    queryFn: () => reservationsService.list({ status }),
  });
  const rows = query.data?.data ?? [];
  const dataStatus = query.isPending ? 'loading' : query.isError ? 'error' : 'success';

  const pillOptions = STATUSES.map((s) => ({ key: s, label: s.charAt(0) + s.slice(1).toLowerCase() }));

  const columns = [
    { key: 'title', header: 'Title', accessor: (row) => row.catalog_item.title, truncate: true, width: '30%' },
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
      render: (row) => (row.expires_at ? <RelativeDate value={row.expires_at} /> : '—'),
      width: '15%',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        (row.status === 'WAITING' || row.status === 'READY') && (
          <RowActions
            menuItems={[{ label: cancel.isPending ? 'Cancelling…' : 'Cancel', onClick: () => cancel.mutate(row.id), danger: true }]}
          />
        ),
      width: '10%',
    },
  ];

  return (
    <>
      <PageHeader title="Reservations" description="The hold queue for every title with no available copy." />

      <TableCard>
        <div className="table-toolbar">
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
          emptyProps={{ title: `No ${status.toLowerCase()} reservations`, filtered: true }}
        />
      </TableCard>
    </>
  );
}
