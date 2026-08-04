// src/admin-portal/pages/overdues/FineDetailPage.jsx
// A Fine has no independent GET /fines/:id endpoint on this backend, so the
// row arrives via router state (see FinesCard.jsx's navigate(...,
// {state:{fine:row}})) rather than a fetch here - if this page is opened
// directly (a bookmark, a refresh) that state is gone and there's genuinely
// no way to recover it, so it says so.
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { DetailPageHeader } from '../../components/layout/DetailPageHeader';
import { DetailSection, DetailField } from '../../components/common/DetailSection';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { RelativeDate } from '../../components/common/RelativeDate';
import { FinesIcon, InfoIcon, UserIcon } from '../../components/common/Icons';
import { WaiveFineModal } from './WaiveFineModal';

function fineStatus(fine) {
  if (fine.waived) return { label: 'Waived', variant: 'neutral' };
  if (fine.paid) return { label: 'Paid', variant: 'success' };
  return { label: 'Unresolved', variant: 'warning' };
}

export function FineDetailPage() {
  const fine = useLocation().state?.fine;
  const { user } = useAuthStore();
  const canWaive = rankAtLeast(user?.role, 'SENIOR_LIBRARIAN');
  const [waiving, setWaiving] = useState(false);

  if (!fine) {
    return (
      <>
        <DetailPageHeader backTo="/admin/overdues" backLabel="Back to Overdues" title="Fine not available" />
        <ErrorState message="This fine's details were only passed along when you clicked its row - opening this page directly (a bookmark, a refresh) doesn't have a way to fetch them back, since this backend has no single-fine lookup endpoint. Go back to Overdues and click the row again." />
      </>
    );
  }

  const status = fineStatus(fine);
  const unresolved = !fine.paid && !fine.waived;

  return (
    <>
      <DetailPageHeader
        backTo="/admin/overdues"
        backLabel="Back to Overdues"
        icon={<FinesIcon size={22} />}
        iconVariant="warning"
        title={`GHS ${Number(fine.amount).toFixed(2)}`}
        subtitle={fine.reason}
        status={<Badge variant={status.variant}>{status.label}</Badge>}
        actions={canWaive && unresolved && <Button onClick={() => setWaiving(true)}>Waive</Button>}
      />

      <DetailSection title="Fine details" icon={<InfoIcon size={16} />} iconVariant="warning">
        <DetailField label="Amount" value={`GHS ${Number(fine.amount).toFixed(2)}`} />
        <DetailField label="Reason" value={fine.reason} />
        <DetailField label="Posted" value={<RelativeDate value={fine.created_at} />} />
        {fine.paid_at && <DetailField label="Paid" value={<RelativeDate value={fine.paid_at} />} />}
        {fine.payment_reference && <DetailField label="Payment reference" value={fine.payment_reference} />}
        {fine.loan_id && (
          <DetailField
            label="Related loan"
            value={
              <Link className="detail-page-back" to={`/admin/loans/${fine.loan_id}`}>
                View loan
              </Link>
            }
          />
        )}
      </DetailSection>

      <DetailSection title="Member" icon={<UserIcon size={16} />} iconVariant="info">
        <DetailField label="Name" value={fine.user.name} />
        <DetailField label="Email" value={fine.user.email} />
        <DetailField label="Student ID" value={fine.user.student_id} />
      </DetailSection>

      {canWaive && <WaiveFineModal open={waiving} onClose={() => setWaiving(false)} fine={fine} />}
    </>
  );
}
