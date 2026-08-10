// src/admin-portal/pages/loans/LoanDetailPage.jsx
// A Loan has no independent GET /circulation/loans/:id endpoint on this
// backend, so the row arrives via router state (see LoansPage.jsx and
// OverdueLoansCard.jsx's navigate(..., {state:{loan:row}})) rather than a
// fetch here - if this page is opened directly (a bookmark, a refresh) that
// state is gone and there's genuinely no way to recover it, so it says so.
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { DetailPageHeader } from '../../components/layout/DetailPageHeader';
import { DetailSection, DetailField } from '../../components/common/DetailSection';
import { Button } from '../../components/common/Button';
import { ErrorState } from '../../components/common/ErrorState';
import { LoanStatusBadge } from '../../components/common/Badge';
import { RelativeDate } from '../../components/common/RelativeDate';
import { DueDate } from '../../components/common/DueDate';
import { LoansIcon, InfoIcon, UserIcon } from '../../components/common/Icons';
import { OverrideReasonModal } from '../../components/common/OverrideReasonModal';
import { deriveLoanStatus } from '../../utils/loanStatus';
import { useLoanActions } from './useLoanActions';

export function LoanDetailPage() {
  const loan = useLocation().state?.loan;

  if (!loan) {
    return (
      <>
        <DetailPageHeader backTo="/admin/loans" backLabel="Back to Loans" title="Loan not available" />
        <ErrorState message="This loan's details were only passed along when you clicked its row - opening this page directly (a bookmark, a refresh) doesn't have a way to fetch them back, since this backend has no single-loan lookup endpoint. Go back to Loans and click the row again." />
      </>
    );
  }

  return <LoanDetail loan={loan} />;
}

function LoanDetail({ loan }) {
  const { renew, returnLoan } = useLoanActions(loan);
  const { user } = useAuthStore();
  const isAdministrator = user?.role === 'ADMINISTRATOR';
  const [overriding, setOverriding] = useState(null); // 'renew' | 'return' | null
  const isActive = !loan.returned_at;
  const derivedStatus = deriveLoanStatus(loan);

  return (
    <>
      <DetailPageHeader
        backTo="/admin/loans"
        backLabel="Back to Loans"
        icon={<LoansIcon size={22} />}
        iconVariant="primary"
        title={loan.copy.catalog_item.title}
        subtitle={loan.user.name}
        status={<LoanStatusBadge status={derivedStatus} />}
        actions={
          isActive && (
            <>
              <Button
                variant="outline"
                onClick={() => (isAdministrator ? setOverriding('renew') : renew.mutate())}
                loading={renew.isPending}
              >
                Renew
              </Button>
              <Button
                onClick={() => (isAdministrator ? setOverriding('return') : returnLoan.mutate())}
                loading={returnLoan.isPending}
              >
                Return
              </Button>
            </>
          )
        }
      />

      <DetailSection title="Loan details" icon={<InfoIcon size={16} />} iconVariant="primary">
        <DetailField label="Barcode" value={loan.copy.barcode} />
        <DetailField label="Author" value={loan.copy.catalog_item.author} />
        <DetailField label="Issued" value={<RelativeDate value={loan.issued_at} />} />
        <DetailField label="Due" value={loan.returned_at ? undefined : <DueDate value={loan.due_date} />} />
        {loan.returned_at && <DetailField label="Returned" value={<RelativeDate value={loan.returned_at} />} />}
        <DetailField label="Renewals" value={loan.renewal_count} />
      </DetailSection>

      <DetailSection title="Borrower" icon={<UserIcon size={16} />} iconVariant="info">
        <DetailField label="Name" value={loan.user.name} />
        <DetailField label="Email" value={loan.user.email} />
        <DetailField label="Student ID" value={loan.user.student_id} />
      </DetailSection>

      {isAdministrator && (
        <>
          <OverrideReasonModal
            open={overriding === 'renew'}
            onClose={() => setOverriding(null)}
            title="Renew loan"
            description="This is normally a Librarian action, so the reason is recorded as an override."
            onConfirm={(reason) => renew.mutate(reason, { onSuccess: () => setOverriding(null) })}
            loading={renew.isPending}
          />
          <OverrideReasonModal
            open={overriding === 'return'}
            onClose={() => setOverriding(null)}
            title="Return loan"
            description="This is normally a Librarian action, so the reason is recorded as an override."
            onConfirm={(reason) => returnLoan.mutate(reason, { onSuccess: () => setOverriding(null) })}
            loading={returnLoan.isPending}
          />
        </>
      )}
    </>
  );
}
