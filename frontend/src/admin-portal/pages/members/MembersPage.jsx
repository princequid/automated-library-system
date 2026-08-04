// src/admin-portal/pages/members/MembersPage.jsx
import { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { membersService } from '../../services/membersService';
import { useApiList } from '../../hooks/useApiList';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { DataTable } from '../../components/common/DataTable';
import { SearchBar } from '../../components/common/SearchBar';
import { FilterPills } from '../../components/common/FilterPills';
import { RowActions } from '../../components/common/RowActions';
import { Button } from '../../components/common/Button';
import { MemberStatusBadge } from '../../components/common/Badge';
import { PlusIcon } from '../../components/common/Icons';
import { MemberCreateModal } from './MemberCreateModal';

const PAGE_SIZE = 20;
const STATUSES = ['ACTIVE', 'SUSPENDED', 'GRADUATED', 'DELETED'];

// Widths sum to 100% - table-layout: fixed (components.css) splits any
// column with no explicit width evenly among its siblings. Student ID moved
// to the detail page (MemberDetailPage.jsx) so this stays at 4 columns.
const COLUMNS = [
  { key: 'name', header: 'Name', accessor: (row) => row.name, sortable: true, truncate: true, width: '26%' },
  { key: 'email', header: 'Email', accessor: (row) => row.email, truncate: true, width: '32%' },
  { key: 'department', header: 'Department', accessor: (row) => row.department ?? '—', truncate: true, width: '22%' },
  {
    key: 'status',
    header: 'Status',
    // Sort by meaning: an active member first, a deleted one last - not
    // alphabetically ("ACTIVE" < "DELETED" < "GRADUATED" < "SUSPENDED" would
    // put a healthy account and a deleted one next to each other).
    sortable: true,
    sortValue: (row) => ({ ACTIVE: 0, SUSPENDED: 1, GRADUATED: 2, DELETED: 3 })[row.status] ?? 9,
    render: (row) => <MemberStatusBadge status={row.status} />,
    width: '20%',
  },
];

/** Real counts only - one lightweight list call per pill, reading meta.total. */
function useMemberPillCounts() {
  const results = useQueries({
    queries: STATUSES.map((s) => ({
      queryKey: ['users', 'members', 'count', s],
      queryFn: () => membersService.list({ status: s, limit: 1 }),
    })),
  });
  return Object.fromEntries(STATUSES.map((s, i) => [s, results[i].data?.meta?.total]));
}

export function MembersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canCreate = rankAtLeast(user?.role, 'SUPER_ADMIN');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [createOpen, setCreateOpen] = useState(false);

  const counts = useMemberPillCounts();
  const pillOptions = STATUSES.map((s) => ({
    key: s,
    label: s.charAt(0) + s.slice(1).toLowerCase(),
    count: counts[s],
  }));

  const { rows, meta, status: fetchStatus, errorMessage, refetch } = useApiList(
    ['users', 'members'],
    membersService.list,
    { page, limit: PAGE_SIZE, search: search || undefined, status }
  );

  function openMember(row) {
    // A member has no independent GET /users/:id endpoint - the detail page
    // reads the row via router state instead of re-fetching it.
    navigate(`/admin/members/${row.id}`, { state: { member: row } });
  }

  const columns = [
    ...COLUMNS,
    { key: 'actions', header: 'Actions', render: (row) => <RowActions onView={() => openMember(row)} />, width: '15%' },
  ];

  return (
    <>
      <PageHeader
        title="Members"
        description="Student accounts, borrowing status, and fines."
        actions={
          canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon size={16} /> Add member
            </Button>
          )
        }
      />

      <TableCard>
        <div className="table-toolbar">
          <SearchBar value={search} onSearch={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, email, or ID…" />
          <FilterPills options={pillOptions} active={status} onChange={(key) => { setStatus(key); setPage(1); }} />
          <p className="filter-results-count">{typeof meta?.total === 'number' ? `${meta.total} results` : ' '}</p>
        </div>
      </TableCard>

      <TableCard>
        <DataTable
          columns={columns}
          data={rows}
          status={fetchStatus}
          errorMessage={errorMessage}
          onRetry={refetch}
          emptyProps={{ filtered: !!search, title: search ? undefined : `No ${status.toLowerCase()} members` }}
          onRowClick={openMember}
          rowAriaLabel={(row) => `Open ${row.name}`}
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={meta?.total}
          onPageChange={setPage}
        />
      </TableCard>

      {canCreate && <MemberCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />}
    </>
  );
}
