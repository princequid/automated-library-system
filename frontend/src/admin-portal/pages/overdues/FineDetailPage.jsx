// src/admin-portal/pages/overdues/FineDetailPage.jsx
// A Fine has no independent GET /fines/:id endpoint on this backend, so the
// row arrives via router state (see FinesCard.jsx's navigate(...,
// {state:{fine:row}})) rather than a fetch here - if this page is opened
// directly (a bookmark, a refresh) that state is gone and there's genuinely
// no way to recover it, so it says so.
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { apiErrorMessage } from '@/lib/api';
import { finesService } from '../../services/finesService';
import { DetailPageHeader } from '../../components/layout/DetailPageHeader';
import { DetailSection, DetailField } from '../../components/common/DetailSection';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ErrorState } from '../../components/common/ErrorState';
import { RelativeDate } from '../../components/common/RelativeDate';
import { FinesIcon, InfoIcon, UserIcon } from '../../components/common/Icons';
import { useToast } from '../../components/common/Toast';
import { OverrideReasonModal } from '../../components/common/OverrideReasonModal';
import { WaiveFineModal } from './WaiveFineModal';

function fineStatus(fine) {
  if (fine.waived) return { label: 'Waived', variant: 'neutral' };
  if (fine.paid) return { label: 'Paid', variant: 'success' };
  if (fine.disputed) return { label: 'Disputed', variant: 'warning' };
  return { label: 'Unresolved', variant: 'warning' };
}

export function FineDetailPage() {
  const fine = useLocation().state?.fine;
  const { user } = useAuthStore();
  // waive/pay-manual/resolve-dispute are requireLibrarianOrOverride() on the
  // backend - both roles reach these, but ADMINISTRATOR must supply an
  // override_reason.
  const canWaive = rankAtLeast(user?.role, 'LIBRARIAN');
  const canRecordPayment = rankAtLeast(user?.role, 'LIBRARIAN');
  const isAdministrator = user?.role === 'ADMINISTRATOR';
  const [waiving, setWaiving] = useState(false);
  const [overridingPayment, setOverridingPayment] = useState(false);
  const [overridingReject, setOverridingReject] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const payManual = useMutation({
    mutationFn: (overrideReason) =>
      finesService.payManual(fine.id, overrideReason ? { override_reason: overrideReason } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      toast.success('Payment recorded.');
      setOverridingPayment(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not record this payment.')),
  });
  const rejectDispute = useMutation({
    mutationFn: (overrideReason) =>
      finesService.resolveDispute(fine.id, {
        resolution: 'reject',
        reason: 'Reviewed - fine stands',
        ...(overrideReason ? { override_reason: overrideReason } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fines'] });
      toast.success('Dispute rejected - the fine stands.');
      setOverridingReject(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not resolve this dispute.')),
  });

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
        actions={
          unresolved && (
            <>
              {fine.disputed && canWaive && (
                <Button
                  variant="outline"
                  onClick={() => (isAdministrator ? setOverridingReject(true) : rejectDispute.mutate())}
                  loading={rejectDispute.isPending}
                >
                  Reject dispute
                </Button>
              )}
              {!fine.disputed && canRecordPayment && (
                <Button
                  variant="outline"
                  onClick={() => (isAdministrator ? setOverridingPayment(true) : payManual.mutate())}
                  loading={payManual.isPending}
                >
                  Record payment
                </Button>
              )}
              {canWaive && <Button onClick={() => setWaiving(true)}>Waive</Button>}
            </>
          )
        }
      />

      <DetailSection title="Fine details" icon={<InfoIcon size={16} />} iconVariant="warning">
        <DetailField label="Amount" value={`GHS ${Number(fine.amount).toFixed(2)}`} />
        <DetailField label="Reason" value={fine.reason} />
        <DetailField label="Posted" value={<RelativeDate value={fine.created_at} />} />
        {fine.disputed && <DetailField label="Dispute reason" value={fine.dispute_reason} span />}
        {fine.paid_at && <DetailField label="Paid" value={<RelativeDate value={fine.paid_at} />} />}
        {fine.payment_method && <DetailField label="Payment method" value={fine.payment_method === 'MOCK' ? 'Simulated (no real gateway connected)' : 'Manual (recorded by staff)'} />}
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

      {isAdministrator && (
        <>
          <OverrideReasonModal
            open={overridingPayment}
            onClose={() => setOverridingPayment(false)}
            title="Record payment"
            description="This is normally a Librarian action, so the reason is recorded as an override."
            onConfirm={(reason) => payManual.mutate(reason)}
            loading={payManual.isPending}
          />
          <OverrideReasonModal
            open={overridingReject}
            onClose={() => setOverridingReject(false)}
            title="Reject dispute"
            description="This is normally a Librarian action, so the reason is recorded as an override."
            onConfirm={(reason) => rejectDispute.mutate(reason)}
            loading={rejectDispute.isPending}
          />
        </>
      )}
    </>
  );
}
