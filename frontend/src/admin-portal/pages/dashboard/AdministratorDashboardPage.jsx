// src/admin-portal/pages/dashboard/AdministratorDashboardPage.jsx
// "System & Library Oversight" - the Administrator's dashboard (spec section
// 22). Deliberately NOT a bigger version of LibrarianDashboardPage: different
// KPIs (people/policy/spend, not circulation charts), different quick
// actions (governance, not desk operations), and a staff-activity table that
// surfaces override usage - the thing only Administrator needs to watch.
import { useQuery } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { reportsService } from '../../services/reportsService';
import { usersService } from '../../services/usersService';
import { catalogService } from '../../services/catalogService';
import { finesService } from '../../services/finesService';
import { greetingLine } from '../../utils/greeting';
import { PageHeader } from '../../components/layout/PageHeader';
import { TableCard } from '../../components/common/TableCard';
import { KpiCard } from '../../components/common/KpiCard';
import { QuickActions } from '../../components/common/QuickActions';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import {
  MembersIcon,
  StaffIcon,
  CatalogueIcon,
  FinesIcon,
  AcquisitionsIcon,
  SettingsIcon,
  ReportsIcon,
  AuditLogIcon,
} from '../../components/common/Icons';

const QUICK_ACTIONS = [
  { label: 'Manage users', to: '/admin/staff', icon: StaffIcon },
  { label: 'Manage roles', to: '/admin/staff', icon: StaffIcon },
  { label: 'Library policies', to: '/admin/settings', icon: SettingsIcon },
  { label: 'System settings', to: '/admin/settings', icon: SettingsIcon },
  { label: 'Reports', to: '/admin/reports', icon: ReportsIcon },
  { label: 'Audit logs', to: '/admin/audit-log', icon: AuditLogIcon },
];

export function AdministratorDashboardPage() {
  const { user } = useAuthStore();

  const studentsQuery = useQuery({
    queryKey: ['users', 'count', 'STUDENT'],
    queryFn: () => usersService.list({ role: 'STUDENT', limit: 1 }),
  });
  const librariansQuery = useQuery({
    queryKey: ['users', 'count', 'LIBRARIAN'],
    queryFn: () => usersService.list({ role: 'LIBRARIAN', limit: 1 }),
  });
  const titlesQuery = useQuery({
    queryKey: ['catalog', 'items', 'count'],
    queryFn: () => catalogService.list({ limit: 1 }),
  });
  const outstandingFinesQuery = useQuery({
    queryKey: ['fines', 'outstanding'],
    queryFn: () => finesService.list({ paid: false, waived: false }),
  });
  const expenditureQuery = useQuery({
    queryKey: ['analytics', 'acquisition-expenditure'],
    queryFn: () => reportsService.acquisitionExpenditure(),
  });
  const staffActivityQuery = useQuery({
    queryKey: ['analytics', 'staff-activity'],
    queryFn: () => reportsService.staffActivity(),
  });

  const outstandingFines = outstandingFinesQuery.data?.data ?? [];
  const outstandingTotal = outstandingFines.reduce((sum, f) => sum + Number(f.amount), 0);
  const expenditure = expenditureQuery.data?.data;
  const staffActivity = staffActivityQuery.data?.data ?? [];

  return (
    <>
      <PageHeader title="System &amp; Library Oversight" description={greetingLine(user?.name)} />

      <QuickActions items={QUICK_ACTIONS} />

      <div className="kpi-grid-primary">
        <KpiCard
          label="Total students"
          value={studentsQuery.data?.meta?.total}
          accent="primary"
          icon={MembersIcon}
          description="Registered accounts"
        />
        <KpiCard
          label="Total librarians"
          value={librariansQuery.data?.meta?.total}
          accent="teal"
          icon={StaffIcon}
          description="Operational staff"
        />
        <KpiCard
          label="Total titles"
          value={titlesQuery.data?.meta?.total}
          accent="info"
          icon={CatalogueIcon}
          description="Catalogued titles"
        />
        <KpiCard
          label="Outstanding fines"
          value={outstandingFinesQuery.isSuccess ? outstandingTotal : undefined}
          precision={2}
          unit=" GHS"
          accent="danger"
          icon={FinesIcon}
          description={outstandingFinesQuery.isSuccess ? `${outstandingFines.length} unresolved` : undefined}
        />
      </div>

      <div className="kpi-grid-secondary">
        <KpiCard
          label="Acquisition spend"
          value={expenditure?.totalSpent}
          precision={2}
          unit=" GHS"
          accent="success"
          icon={AcquisitionsIcon}
          description={expenditure ? `${expenditure.receivedCount} received` : undefined}
        />
        <KpiCard
          label="Pending acquisitions"
          value={expenditure?.pendingRequestCount}
          accent="warning"
          icon={AcquisitionsIcon}
          description="Requested, approved, or ordered"
        />
      </div>

      <TableCard title="Librarian activity" description="Actions per staff member, including audited Administrator overrides.">
        {staffActivityQuery.isPending && <LoadingState label="Loading…" />}
        {staffActivityQuery.isError && (
          <ErrorState message={apiErrorMessage(staffActivityQuery.error)} onRetry={staffActivityQuery.refetch} />
        )}
        {staffActivityQuery.isSuccess && staffActivity.length === 0 && (
          <EmptyState title="No activity yet" description="Staff actions will show up here." />
        )}
        {staffActivity.length > 0 && (
          <ul className="recent-activity-list">
            {staffActivity.map((row) => (
              <li key={row.actorId}>
                <span className="recent-activity-title">{row.name}</span>
                <span className="recent-activity-borrower">{row.role}</span>
                <span className="recent-activity-status">
                  {row.totalActions} action{row.totalActions === 1 ? '' : 's'}
                  {row.overrideActions > 0 && (
                    <Badge variant="warning" className="staff-activity-override-badge">
                      {row.overrideActions} override{row.overrideActions === 1 ? '' : 's'}
                    </Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </TableCard>
    </>
  );
}
