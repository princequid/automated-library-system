// src/admin-portal/pages/acquisitions/AcquisitionsPage.jsx
// Book request -> Administrator approval -> purchase -> catalogued. Approve/
// reject are ADMINISTRATOR-only (matches the backend's requireRole('ADMINISTRATOR')
// exactly, per the spec's own "Administrator approval" wording). Request/mark-
// ordered/receive are LIBRARIAN-only - Administrator has view-only access to
// this whole operational side (backend: requireRole('LIBRARIAN') exact, no
// override path, since the spec lists "Receive Books" as Administrator = View).
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { acquisitionsService } from '../../services/acquisitionsService';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { FilterPills } from '../../components/common/FilterPills';
import { RowActions } from '../../components/common/RowActions';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { RelativeDate } from '../../components/common/RelativeDate';
import { useToast } from '../../components/common/Toast';
import { PlusIcon } from '../../components/common/Icons';
import { CreateAcquisitionModal } from './CreateAcquisitionModal';
import { ReceiveAcquisitionModal } from './ReceiveAcquisitionModal';

const STATUSES = ['REQUESTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'REJECTED'];
const STATUS_VARIANT = { REQUESTED: 'warning', APPROVED: 'info', ORDERED: 'teal', RECEIVED: 'success', REJECTED: 'danger' };

export function AcquisitionsPage() {
  const { user } = useAuthStore();
  const isAdmin = rankAtLeast(user?.role, 'ADMINISTRATOR');
  const canWrite = user?.role === 'LIBRARIAN';
  const [status, setStatus] = useState('REQUESTED');
  const [creating, setCreating] = useState(false);
  const [receiving, setReceiving] = useState(null);
  const queryClient = useQueryClient();
  const toast = useToast();

  const query = useQuery({ queryKey: ['acquisitions', 'list', status], queryFn: () => acquisitionsService.list({ status }) });
  const rows = query.data?.data ?? [];
  const dataStatus = query.isPending ? 'loading' : query.isError ? 'error' : 'success';

  const approve = useMutation({
    mutationFn: (id) => acquisitionsService.approve(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['acquisitions'] }); toast.success('Approved.'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });
  const reject = useMutation({
    mutationFn: (id) => acquisitionsService.reject(id, 'Not needed at this time'),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['acquisitions'] }); toast.success('Rejected.'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });
  const markOrdered = useMutation({
    mutationFn: (id) => acquisitionsService.markOrdered(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['acquisitions'] }); toast.success('Marked ordered.'); },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  function menuItemsFor(row) {
    const items = [];
    if (row.status === 'REQUESTED' && isAdmin) {
      items.push({ label: 'Approve', onClick: () => approve.mutate(row.id) });
      items.push({ label: 'Reject', onClick: () => reject.mutate(row.id), danger: true });
    }
    if (row.status === 'APPROVED' && canWrite) items.push({ label: 'Mark ordered', onClick: () => markOrdered.mutate(row.id) });
    if ((row.status === 'APPROVED' || row.status === 'ORDERED') && canWrite) items.push({ label: 'Receive', onClick: () => setReceiving(row) });
    return items;
  }

  const pillOptions = STATUSES.map((s) => ({ key: s, label: s.charAt(0) + s.slice(1).toLowerCase() }));

  const columns = [
    { key: 'title', header: 'Title', accessor: (row) => row.title, truncate: true, width: '32%' },
    { key: 'author', header: 'Author', accessor: (row) => row.author ?? '—', truncate: true, width: '22%' },
    { key: 'requested', header: 'Requested', render: (row) => <RelativeDate value={row.created_at} />, width: '16%' },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>, width: '15%' },
    { key: 'actions', header: 'Actions', render: (row) => <RowActions menuItems={menuItemsFor(row)} />, width: '15%' },
  ];

  return (
    <>
      <PageHeader
        title="Acquisitions"
        description="Book requests, from suggestion through to catalogued."
        actions={
          canWrite && (
            <Button onClick={() => setCreating(true)}>
              <PlusIcon size={16} /> Request a book
            </Button>
          )
        }
      />

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
          emptyProps={{ title: `No ${status.toLowerCase()} requests`, filtered: true }}
        />
      </TableCard>

      <CreateAcquisitionModal open={creating} onClose={() => setCreating(false)} />
      <ReceiveAcquisitionModal acquisition={receiving} onClose={() => setReceiving(null)} />
    </>
  );
}
