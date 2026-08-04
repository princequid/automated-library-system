// src/admin-portal/pages/staff/StaffPage.jsx
import { useState } from 'react';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiErrorMessage } from '@/lib/api';
import { staffService, STAFF_ROLES } from '../../services/staffService';
import { useApiList } from '../../hooks/useApiList';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { FilterPills } from '../../components/common/FilterPills';
import { RowActions } from '../../components/common/RowActions';
import { Button } from '../../components/common/Button';
import { MemberStatusBadge } from '../../components/common/Badge';
import { PlusIcon } from '../../components/common/Icons';
import { useToast } from '../../components/common/Toast';
import { StaffCreateModal } from './StaffCreateModal';

const PAGE_SIZE = 20;
const ROLE_LABEL = Object.fromEntries(STAFF_ROLES.map((r) => [r, r.replace('_', ' ')]));

/** Real counts only - GET /users has no multi-role filter, so this is one lightweight call per role, reading meta.total. */
function useStaffPillCounts() {
  const results = useQueries({
    queries: STAFF_ROLES.map((r) => ({ queryKey: ['users', 'staff', 'count', r], queryFn: () => staffService.list({ role: r, limit: 1 }) })),
  });
  return Object.fromEntries(STAFF_ROLES.map((r, i) => [r, results[i].data?.meta?.total]));
}

export function useStaffStatusToggle(member) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const nextStatus = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

  return useMutation({
    mutationFn: () => staffService.setStatus(member.id, { status: nextStatus, reason: `Set to ${nextStatus} from Staff page` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'staff'] });
      toast.success(`${member.name} is now ${nextStatus.toLowerCase()}.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update status.')),
  });
}

function StaffRowActions({ member, onView }) {
  const toggle = useStaffStatusToggle(member);
  const canToggle = member.status === 'ACTIVE' || member.status === 'SUSPENDED';
  const nextLabel = member.status === 'ACTIVE' ? 'Suspend' : 'Reactivate';

  return (
    <RowActions onView={onView} menuItems={canToggle ? [{ label: toggle.isPending ? `${nextLabel}…` : nextLabel, onClick: () => toggle.mutate() }] : []} />
  );
}

export function StaffPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('LIBRARIAN');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  const counts = useStaffPillCounts();
  const pillOptions = STAFF_ROLES.map((r) => ({ key: r, label: ROLE_LABEL[r], count: counts[r] }));

  const { rows, meta, status, errorMessage, refetch } = useApiList(['users', 'staff'], staffService.list, { page, limit: PAGE_SIZE, role });

  function openStaff(row) {
    // A staff account has no independent GET /users/:id endpoint - the
    // detail page reads the row via router state instead of re-fetching it.
    navigate(`/admin/staff/${row.id}`, { state: { staff: row } });
  }

  const columns = [
    { key: 'name', header: 'Name', accessor: (row) => row.name, sortable: true, truncate: true, width: '26%' },
    { key: 'email', header: 'Email', accessor: (row) => row.email, truncate: true, width: '30%' },
    { key: 'department', header: 'Department', accessor: (row) => row.department ?? '—', truncate: true, width: '20%' },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (row) => ({ ACTIVE: 0, SUSPENDED: 1, GRADUATED: 2, DELETED: 3 })[row.status] ?? 9,
      render: (row) => <MemberStatusBadge status={row.status} />,
      width: '14%',
    },
    { key: 'actions', header: 'Actions', render: (row) => <StaffRowActions member={row} onView={() => openStaff(row)} />, width: '10%' },
  ];

  return (
    <>
      <PageHeader
        title="Staff"
        description="Front-desk and library-management accounts."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon size={16} /> Add staff
          </Button>
        }
      />

      <TableCard>
        <div className="table-toolbar">
          <FilterPills options={pillOptions} active={role} onChange={(key) => { setRole(key); setPage(1); }} />
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
          emptyProps={{ title: `No ${ROLE_LABEL[role].toLowerCase()} accounts yet` }}
          onRowClick={openStaff}
          rowAriaLabel={(row) => `Open ${row.name}`}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={meta?.total}
          onPageChange={setPage}
        />
      </TableCard>

      <StaffCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
