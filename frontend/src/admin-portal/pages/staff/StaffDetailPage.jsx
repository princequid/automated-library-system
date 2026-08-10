// src/admin-portal/pages/staff/StaffDetailPage.jsx
// A staff account has no independent GET /users/:id endpoint on this
// backend, so the row arrives via router state (see StaffPage.jsx's
// navigate(..., {state:{staff:row}})) rather than a fetch here - if this
// page is opened directly (a bookmark, a refresh) that state is gone and
// there's genuinely no way to recover it, so it says so.
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/lib/api';
import { DetailPageHeader } from '../../components/layout/DetailPageHeader';
import { DetailSection, DetailField } from '../../components/common/DetailSection';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { MemberStatusBadge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { RelativeDate } from '../../components/common/RelativeDate';
import { StaffIcon, InfoIcon } from '../../components/common/Icons';
import { useToast } from '../../components/common/Toast';
import { staffService, STAFF_ROLES } from '../../services/staffService';
import { useStaffStatusToggle } from './StaffPage';

const ROLE_OPTIONS = STAFF_ROLES.map((r) => ({ value: r, label: r.charAt(0) + r.slice(1).toLowerCase() }));

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

// Roles & Permissions (ADMINISTRATOR only - this whole page is already gated
// that way, see constants/nav.js). Reassigns via PUT /users/:id/role, which
// the backend refuses if it would leave the system with no Administrator.
function useStaffRoleChange(staff) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (role) => staffService.setRole(staff.id, role),
    onSuccess: (_data, role) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'staff'] });
      toast.success(`${staff.name} is now ${role.toLowerCase()}.`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not change this account\'s role.')),
  });
}

function StaffDetail({ staff }) {
  const toggle = useStaffStatusToggle(staff);
  const canToggle = staff.status === 'ACTIVE' || staff.status === 'SUSPENDED';
  const nextLabel = staff.status === 'ACTIVE' ? 'Suspend' : 'Reactivate';
  const [roleDraft, setRoleDraft] = useState(staff.role);
  const roleChange = useStaffRoleChange(staff);

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
        <DetailField label="Department" value={staff.department} />
        <DetailField label="Created" value={staff.created_at ? <RelativeDate value={staff.created_at} /> : undefined} />
      </DetailSection>

      <DetailSection title="Role" icon={<InfoIcon size={16} />} iconVariant="warning">
        <div className="member-status-row detail-field-full">
          <Select options={ROLE_OPTIONS} value={roleDraft} onChange={(e) => setRoleDraft(e.target.value)} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => roleChange.mutate(roleDraft)}
            loading={roleChange.isPending}
            disabled={roleDraft === staff.role}
          >
            Change role
          </Button>
        </div>
      </DetailSection>
    </>
  );
}
