// src/admin-portal/pages/auditLog/AuditLogPage.jsx
import { useState } from 'react';
import { auditLogService } from '../../services/auditLogService';
import { useApiList } from '../../hooks/useApiList';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { RelativeDate } from '../../components/common/RelativeDate';

const PAGE_SIZE = 25;

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const { rows, meta, status, errorMessage, refetch } = useApiList(['audit-logs'], auditLogService.list, { page, limit: PAGE_SIZE });

  const columns = [
    { key: 'action', header: 'Action', accessor: (row) => row.action, truncate: true, width: '25%' },
    { key: 'entity', header: 'Entity', accessor: (row) => `${row.entity_type}${row.entity_id ? ` (${row.entity_id.slice(0, 8)})` : ''}`, truncate: true, width: '25%' },
    { key: 'actor', header: 'Actor', accessor: (row) => row.actor_id.slice(0, 8), width: '15%' },
    { key: 'when', header: 'When', render: (row) => <RelativeDate value={row.created_at} />, width: '20%' },
    {
      key: 'details',
      header: '',
      render: (row) => (
        <button type="button" className="row-actions-view" onClick={() => setExpanded(expanded === row.id ? null : row.id)}>
          {expanded === row.id ? 'Hide' : 'Details'}
        </button>
      ),
      width: '15%',
    },
  ];

  const expandedRow = rows.find((r) => r.id === expanded);

  return (
    <>
      <PageHeader title="Audit Log" description="Every sensitive administrative action, recorded automatically." />

      <TableCard>
        <DataTable
          columns={columns}
          data={rows}
          status={status}
          errorMessage={errorMessage}
          onRetry={refetch}
          emptyProps={{ title: 'No audit entries yet' }}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={meta?.total}
          onPageChange={setPage}
        />
      </TableCard>

      {expandedRow && (
        <TableCard title="Entry detail">
          <div className="detail-field-full">
            <pre className="detail-field-value" style={{ whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
              {JSON.stringify({ before: expandedRow.before, after: expandedRow.after }, null, 2)}
            </pre>
          </div>
        </TableCard>
      )}
    </>
  );
}
