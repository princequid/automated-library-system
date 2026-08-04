// src/admin-portal/pages/staff/StaffDetailPage.jsx
// A staff account has no independent GET /users/:id endpoint on this
// backend, so the row arrives via router state (see StaffPage.jsx's
// navigate(..., {state:{staff:row}})) rather than a fetch here - if this
// page is opened directly (a bookmark, a refresh) that state is gone and
// there's genuinely no way to recover it, so it says so.
import { useLocation } from 'react-router-dom';
import { DetailPageHeader } from '../../components/layout/DetailPageHeader';
import { DetailSection, DetailField } from '../../components/common/DetailSection';
import { Button } from '../../components/common/Button';
import { MemberStatusBadge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { RelativeDate } from '../../components/common/RelativeDate';
import { StaffIcon, InfoIcon } from '../../components/common/Icons';
import { useStaffStatusToggle } from './StaffPage';

export function StaffDetailPage() {
  const staff = useLocation().state?.staff;

  if (!staff) {
    return (
      <>
        <DetailPageHeader backTo="/admin/staff" backLabel="Back to Staff" title="Account not available" />
        <ErrorState message="This account's details were only passed along when you clicked its row - opening this page directly (a bookmark, a refresh) doesn't have a way to fetch them back, since this backend has no single-account lookup endpoint. Go back to Staff and click the row again." />
      </>
    );
  }

  return <StaffDetail staff={staff} />;
}

function StaffDetail({ staff }) {
  const toggle = useStaffStatusToggle(staff);
  const canToggle = staff.status === 'ACTIVE' || staff.status === 'SUSPENDED';
  const nextLabel = staff.status === 'ACTIVE' ? 'Suspend' : 'Reactivate';

  return (
    <>
      <DetailPageHeader
        backTo="/admin/staff"
        backLabel="Back to Staff"
        icon={<StaffIcon size={22} />}
        iconVariant="teal"
        title={staff.name}
        subtitle={staff.email}
        status={<MemberStatusBadge status={staff.status} />}
        actions={
          canToggle && (
            <Button variant={nextLabel === 'Suspend' ? 'outline' : 'success'} onClick={() => toggle.mutate()} loading={toggle.isPending}>
              {nextLabel}
            </Button>
          )
        }
      />

      <DetailSection title="Account details" icon={<InfoIcon size={16} />} iconVariant="teal">
        <DetailField label="Role" value={staff.role?.replace('_', ' ')} />
        <DetailField label="Department" value={staff.department} />
        <DetailField label="Created" value={staff.created_at ? <RelativeDate value={staff.created_at} /> : undefined} />
      </DetailSection>
    </>
  );
}
