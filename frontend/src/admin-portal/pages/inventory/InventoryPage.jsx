// src/admin-portal/pages/inventory/InventoryPage.jsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { inventoryService } from '../../services/inventoryService';
import { locationsService } from '../../services/locationsService';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { FormField } from '../../components/common/FormField';
import { RelativeDate } from '../../components/common/RelativeDate';
import { useToast } from '../../components/common/Toast';
import { PlusIcon } from '../../components/common/Icons';

function StartSessionModal({ open, onClose, onStarted }) {
  const [shelfId, setShelfId] = useState('');
  const toast = useToast();
  const shelvesQuery = useQuery({ queryKey: ['locations', 'tree'], queryFn: locationsService.tree, enabled: open });
  const shelves = (shelvesQuery.data?.data ?? []).flatMap((lib) =>
    lib.floors.flatMap((f) => f.sections.flatMap((s) => s.shelves.map((sh) => ({ ...sh, path: `${lib.name} / ${f.name} / ${s.name} / ${sh.name}` }))))
  );

  const mutation = useMutation({
    mutationFn: () => inventoryService.start({ shelf_id: shelfId || undefined }),
    onSuccess: (envelope) => {
      toast.success('Inventory session started.');
      onStarted(envelope.data.id);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not start a session.')),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start a stocktake"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
            Start
          </Button>
        </>
      }
    >
      <FormField label="Shelf" hint="Leave blank to check every AVAILABLE/RESERVED copy system-wide.">
        {(props) => (
          <select {...props} className="select" value={shelfId} onChange={(e) => setShelfId(e.target.value)}>
            <option value="">Whole library</option>
            {shelves.map((s) => (
              <option key={s.id} value={s.id}>
                {s.path}
              </option>
            ))}
          </select>
        )}
      </FormField>
    </Modal>
  );
}

export function InventoryPage() {
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const query = useQuery({ queryKey: ['inventory', 'sessions'], queryFn: inventoryService.list });
  const rows = query.data?.data ?? [];
  const status = query.isPending ? 'loading' : query.isError ? 'error' : 'success';

  const columns = [
    { key: 'scope', header: 'Scope', accessor: (row) => row.shelf?.name ?? 'Whole library', truncate: true, width: '30%' },
    { key: 'started', header: 'Started', render: (row) => <RelativeDate value={row.started_at} />, width: '20%' },
    { key: 'expected', header: 'Expected', accessor: (row) => row.expected_count, numeric: true, width: '15%' },
    { key: 'scanned', header: 'Scanned', accessor: (row) => row.scanned_count, numeric: true, width: '15%' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={row.status === 'COMPLETED' ? 'success' : 'warning'}>{row.status}</Badge>,
      width: '10%',
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button type="button" className="row-actions-view" onClick={() => navigate(`/admin/inventory/${row.id}`)}>
          Open
        </button>
      ),
      width: '10%',
    },
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Reconcile the catalogue against what's physically on the shelf."
        actions={
          <Button onClick={() => setStarting(true)}>
            <PlusIcon size={16} /> Start session
          </Button>
        }
      />

      <TableCard>
        <DataTable
          columns={columns}
          data={rows}
          status={status}
          errorMessage={query.error ? apiErrorMessage(query.error) : undefined}
          onRetry={query.refetch}
          emptyProps={{ title: 'No stocktakes yet' }}
          onRowClick={(row) => navigate(`/admin/inventory/${row.id}`)}
          rowAriaLabel={(row) => `Open session ${row.id}`}
        />
      </TableCard>

      <StartSessionModal
        open={starting}
        onClose={() => setStarting(false)}
        onStarted={(id) => {
          setStarting(false);
          navigate(`/admin/inventory/${id}`);
        }}
      />
    </>
  );
}
