// src/admin-portal/pages/members/MemberDetailPage.jsx
// A member has no independent GET /users/:id endpoint on this backend, so
// the profile fields below arrive via router state (see MembersPage.jsx's
// navigate(..., {state:{member:row}})) rather than a fetch here - if this
// page is opened directly (a bookmark, a refresh) that state is gone and
// there is genuinely no way to recover it from this backend, so it says so
// rather than pretending a fetch that doesn't exist. Loans/fines/eligibility
// DO have real per-id endpoints and are always fetched fresh below.
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { rankAtLeast } from '@/lib/roles';
import { apiErrorMessage } from '@/lib/api';
import { usersService } from '../../services/usersService';
import { DetailPageHeader } from '../../components/layout/DetailPageHeader';
import { DetailSection, DetailField } from '../../components/common/DetailSection';
import { Button } from '../../components/common/Button';
import { FormField } from '../../components/common/FormField';
import { Select } from '../../components/common/Select';
import { MemberStatusBadge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';
import { RelativeDate } from '../../components/common/RelativeDate';
import { DueDate } from '../../components/common/DueDate';
import { useToast } from '../../components/common/Toast';
import { MembersIcon, UserIcon, StaffIcon, SuccessIcon, ActiveLoansIcon, FinesIcon } from '../../components/common/Icons';

const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED', 'GRADUATED', 'DELETED'].map((v) => ({ value: v, label: v }));

export function MemberDetailPage() {
  const member = useLocation().state?.member;
  const { user } = useAuthStore();
  const canEditProfile = rankAtLeast(user?.role, 'LIBRARIAN');
  const canChangeStatus = rankAtLeast(user?.role, 'ADMINISTRATOR');
  const queryClient = useQueryClient();
  const toast = useToast();

  const [fields, setFields] = useState(() => ({
    name: member?.name ?? '',
    department: member?.department ?? '',
    year_of_study: member?.year_of_study ?? '',
    member_level: member?.member_level ?? '',
  }));
  const [statusDraft, setStatusDraft] = useState(member?.status ?? 'ACTIVE');
  const [statusReason, setStatusReason] = useState('');

  const loansQuery = useQuery({
    queryKey: ['users', member?.id, 'loans'],
    queryFn: () => usersService.loans(member.id),
    enabled: !!member,
  });
  const finesQuery = useQuery({
    queryKey: ['users', member?.id, 'fines'],
    queryFn: () => usersService.fines(member.id),
    enabled: !!member,
  });
  const eligibilityQuery = useQuery({
    queryKey: ['users', member?.id, 'eligibility'],
    queryFn: () => usersService.eligibility(member.id),
    enabled: !!member,
  });

  const updateProfile = useMutation({
    mutationFn: () =>
      usersService.update(member.id, {
        name: fields.name.trim(),
        department: fields.department.trim() || undefined,
        year_of_study: fields.year_of_study ? Number(fields.year_of_study) : undefined,
        member_level: fields.member_level || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Profile updated.');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update this profile.')),
  });

  const updateStatus = useMutation({
    mutationFn: () => usersService.setStatus(member.id, { status: statusDraft, reason: statusReason.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Status updated.');
      setStatusReason('');
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update status.')),
  });

  if (!member) {
    return (
      <>
        <DetailPageHeader backTo="/admin/members" backLabel="Back to Members" title="Member not available" />
        <ErrorState
          message="This member's details were only passed along when you clicked their row - opening this page directly (a bookmark, a refresh) doesn't have a way to fetch them back, since this backend has no single-member lookup endpoint. Go back to Members and click the row again."
        />
      </>
    );
  }

  const loans = loansQuery.data?.data ?? [];
  const fines = finesQuery.data?.data ?? [];
  const activeLoans = loans.filter((l) => !l.returned_at);
  const outstandingFines = fines.filter((f) => !f.paid && !f.waived);
  const eligibility = eligibilityQuery.data?.data;

  return (
    <>
      <DetailPageHeader
        backTo="/admin/members"
        backLabel="Back to Members"
        icon={<MembersIcon size={22} />}
        iconVariant="info"
        title={member.name}
        subtitle={member.email}
        status={<MemberStatusBadge status={member.status} />}
      />

      <DetailSection title="Profile" icon={<UserIcon size={16} />} iconVariant="info">
        <div className="detail-field-full">
          <div className="form-grid-2">
            <FormField label="Name" required>
              {(props) => (
                <input {...props} disabled={!canEditProfile} value={fields.name} onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))} />
              )}
            </FormField>
            <FormField label="Department">
              {(props) => (
                <input
                  {...props}
                  disabled={!canEditProfile}
                  value={fields.department}
                  onChange={(e) => setFields((f) => ({ ...f, department: e.target.value }))}
                />
              )}
            </FormField>
            <FormField label="Student ID">{(props) => <input {...props} disabled value={member.student_id ?? ''} />}</FormField>
            <FormField label="Year of study">
              {(props) => (
                <input
                  {...props}
                  type="number"
                  min={1}
                  max={10}
                  disabled={!canEditProfile}
                  value={fields.year_of_study}
                  onChange={(e) => setFields((f) => ({ ...f, year_of_study: e.target.value }))}
                />
              )}
            </FormField>
            <FormField label="Level" hint="Drives borrowing policy: loan limit, loan period, renewals, fine rate. Leave unset to infer from year of study.">
              {(props) => (
                <Select
                  {...props}
                  disabled={!canEditProfile}
                  placeholder="Infer from year of study"
                  options={[
                    { value: 'UNDERGRADUATE', label: 'Undergraduate' },
                    { value: 'POSTGRADUATE', label: 'Postgraduate' },
                    { value: 'LECTURER', label: 'Lecturer' },
                  ]}
                  value={fields.member_level}
                  onChange={(e) => setFields((f) => ({ ...f, member_level: e.target.value }))}
                />
              )}
            </FormField>
          </div>
          {canEditProfile && (
            <Button size="sm" onClick={() => updateProfile.mutate()} loading={updateProfile.isPending} className="member-detail-save">
              Save profile
            </Button>
          )}
        </div>
      </DetailSection>

      {canChangeStatus && (
        <DetailSection title="Change status" icon={<StaffIcon size={16} />} iconVariant="warning">
          <div className="member-status-row detail-field-full">
            <Select options={STATUS_OPTIONS} value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} />
            <input
              type="text"
              placeholder="Reason (required)"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="member-status-reason"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus.mutate()}
              loading={updateStatus.isPending}
              disabled={!statusReason.trim() || statusDraft === member.status}
            >
              Apply
            </Button>
          </div>
        </DetailSection>
      )}

      <DetailSection title="Eligibility" icon={<SuccessIcon size={16} />} iconVariant="success">
        <div className="detail-field-full">
          {eligibilityQuery.isPending && <LoadingState label="Checking…" />}
          {eligibilityQuery.isError && <ErrorState message={apiErrorMessage(eligibilityQuery.error)} onRetry={eligibilityQuery.refetch} />}
          {eligibility && (
            <p className={`member-eligibility ${eligibility.eligible ? 'is-eligible' : 'is-blocked'}`}>
              {eligibility.eligible
                ? `Eligible to borrow (${eligibility.active_loans}/${eligibility.loan_limit} loans out).`
                : eligibility.reason}
            </p>
          )}
        </div>
      </DetailSection>

      <DetailSection title={`Active loans (${activeLoans.length})`} icon={<ActiveLoansIcon size={16} />} iconVariant="primary">
        <div className="detail-field-full">
          {loansQuery.isPending && <LoadingState label="Loading loans…" />}
          {loansQuery.isError && <ErrorState message={apiErrorMessage(loansQuery.error)} onRetry={loansQuery.refetch} />}
          {loansQuery.isSuccess && activeLoans.length === 0 && <p className="member-detail-empty">No active loans.</p>}
          {activeLoans.length > 0 && (
            <ul className="member-mini-list">
              {activeLoans.map((loan) => (
                <li key={loan.id}>
                  <span>{loan.copy.catalog_item.title}</span>
                  <DueDate value={loan.due_date} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </DetailSection>

      <DetailSection title="Outstanding fines" icon={<FinesIcon size={16} />} iconVariant="danger">
        <div className="detail-field-full">
          {finesQuery.isPending && <LoadingState label="Loading fines…" />}
          {finesQuery.isError && <ErrorState message={apiErrorMessage(finesQuery.error)} onRetry={finesQuery.refetch} />}
          {finesQuery.isSuccess && outstandingFines.length === 0 && <p className="member-detail-empty">No outstanding fines.</p>}
          {outstandingFines.length > 0 && (
            <ul className="member-mini-list">
              {outstandingFines.map((fine) => (
                <li key={fine.id}>
                  <span>{fine.reason}</span>
                  <span className="member-fine-amount">GHS {Number(fine.amount).toFixed(2)}</span>
                  <RelativeDate value={fine.created_at} className="member-detail-meta" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </DetailSection>
    </>
  );
}
