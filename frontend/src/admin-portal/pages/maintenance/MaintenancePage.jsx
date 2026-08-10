// src/admin-portal/pages/maintenance/MaintenancePage.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { maintenanceService } from '../../services/maintenanceService';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { FilterPills } from '../../components/common/FilterPills';
import { RowActions } from '../../components/common/RowActions';
import { Badge } from '../../components/common/Badge';
import { RelativeDate } from '../../components/common/RelativeDate';
import { ResolveMaintenanceModal } from './ResolveMaintenanceModal';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'WITHDRAWN'];
const STATUS_VARIANT = { OPEN: 'warning', IN_PROGRESS: 'info', RESOLVED: 'success', WITHDRAWN: 'neutral' };
const SEVERITY_VARIANT = { MINOR: 'info', MAJOR: 'warning', SEVERE: 'danger' };

export function MaintenancePage() {
  const [status, setStatus] = useState('OPEN');
  const [resolving, setResolving] = useState(null);

  const query = useQuery({
    queryKey: ['maintenance', 'list', status],
    queryFn: () => maintenanceService.list({ status }),
  });
  const rows = query.data?.data ?? [];
  const dataStatus = query.isPending ? 'loading' : query.isError ? 'error' : 'success';

  const pillOptions = STATUSES.map((s) => ({ key: s, label: s.replace('_', ' ') }));

  const columns = [
    { key: 'title', header: 'Title', accessor: (row) => row.copy.catalog_item.title, truncate: true, width: '30%' },
    { key: 'barcode', header: 'Barcode', accessor: (row) => row.copy.barcode, width: '18%' },
    { key: 'severity', header: 'Severity', render: (row) => <Badge variant={SEVERITY_VARIANT[row.severity]}>{row.severity}</Badge>, width: '14%' },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{row.status.replace('_', ' ')}</Badge>, width: '14%' },
    { key: 'opened', header: 'Opened', render: (row) => <RelativeDate value={row.opened_at} />, width: '14%' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        (row.status === 'OPEN' || row.status === 'IN_PROGRESS') && (
          <RowActions onView={() => setResolving(row)} viewLabel="Resolve" />
        ),
      width: '10%',
    },
  ];

  return (
    <>
      <PageHeader title="Maintenance" description="Repair tickets opened when a copy is flagged damaged." />

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
          emptyProps={{ title: `No ${status.toLowerCase().replace('_', ' ')} tickets`, filtered: true }}
        />
      </TableCard>

      <ResolveMaintenanceModal ticket={resolving} onClose={() => setResolving(null)} />
    </>
  );
}
