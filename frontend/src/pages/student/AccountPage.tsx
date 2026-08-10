// frontend/src/pages/student/AccountPage.tsx
// Profile summary, a borrowing-quota ring, an itemised fines section with "Pay all",
// and a change-password form.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageTransition } from '@/components/ui/page-transition';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/states';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/shared';
import { toast } from '@/components/ui/toast';
import { useMe, useMyFines, useMyEligibility, usePayFines, useDisputeFine } from '@/hooks/api';
import { useChangePassword } from '@/hooks/useAuth';
import { apiErrorMessage } from '@/lib/api';
import { formatGhs } from '@/lib/format';
import type { Fine } from '@/lib/types';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirm: z.string().min(1, 'Confirm your new password'),
  })
  .refine((v) => v.newPassword === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });
type PasswordForm = z.infer<typeof passwordSchema>;

export function AccountPage() {
  const me = useMe();
  const fines = useMyFines();
  const eligibility = useMyEligibility();
  const pay = usePayFines();
  const dispute = useDisputeFine();
  const changePassword = useChangePassword();
  const [disputing, setDisputing] = useState<Fine | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  const unpaidFines = (fines.data ?? []).filter((f) => !f.paid && !f.waived);
  const finesTotal = unpaidFines.reduce((sum, f) => sum + Number(f.amount), 0);

  const onDispute = async () => {
    if (!disputing) return;
    try {
      await dispute.mutateAsync({ id: disputing.id, reason: disputeReason.trim() });
      toast.success('Dispute submitted', 'A librarian will review it.');
      setDisputing(null);
      setDisputeReason('');
    } catch (err) {
      toast.error('Could not submit dispute', apiErrorMessage(err));
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onPayAll = async () => {
    try {
      await pay.mutateAsync(unpaidFines.map((f) => f.id));
      toast.success('Payment recorded', `Paid ${formatGhs(finesTotal)}`);
    } catch (err) {
      toast.error('Payment failed', apiErrorMessage(err));
    }
  };

  const onChangePassword = handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed', 'Please sign in again next time.');
      reset();
    } catch (err) {
      toast.error('Could not change password', apiErrorMessage(err));
    }
  });

  return (
    <PageTransition>
      <PageHeader title="Account" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile + quota */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center py-8 text-center">
            {me.isLoading ? (
              <Skeleton className="h-28 w-28 rounded-full" />
            ) : (
              <ProgressRing
                value={me.data?.activeLoanCount ?? 0}
                max={eligibility.data?.loan_limit ?? 5}
                label={`${me.data?.activeLoanCount ?? 0}/${eligibility.data?.loan_limit ?? 5}`}
                sublabel="loans used"
              />
            )}
            <p className="mt-4 text-base font-medium text-text-primary">{me.data?.name}</p>
            <p className="text-sm text-text-secondary">{me.data?.student_id}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {me.data?.department}
              {me.data?.year_of_study ? ` · Year ${me.data.year_of_study}` : ''}
            </p>
          </CardContent>
        </Card>

        {/* Fines */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Outstanding fines</CardTitle>
            {finesTotal > 0 && (
              <Button loading={pay.isPending} onClick={onPayAll}>
                Pay all · {formatGhs(finesTotal)}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {fines.isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : unpaidFines.length === 0 ? (
              <EmptyState title="No outstanding fines" description="You're all clear." />
            ) : (
              <ul className="divide-y divide-border">
                {unpaidFines.map((fine) => (
                  <li key={fine.id} className="flex items-center justify-between py-3">
                    <span className="text-sm text-text-primary">
                      {fine.reason}
                      {fine.disputed && <span className="ml-2 text-xs font-medium text-warning-text">Disputed</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-error-text">{formatGhs(fine.amount)}</span>
                      {!fine.disputed && (
                        <button
                          type="button"
                          className="text-xs font-medium text-text-secondary underline hover:text-text-primary"
                          onClick={() => setDisputing(fine)}
                        >
                          Dispute
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                <li className="flex items-center justify-between pt-3">
                  <span className="text-sm font-medium text-text-primary">Total</span>
                  <span className="text-sm font-medium text-text-primary">{formatGhs(finesTotal)}</span>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Change password */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onChangePassword} className="grid max-w-md gap-4" noValidate>
              <Field label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
                <Input id="currentPassword" type="password" invalid={!!errors.currentPassword} {...register('currentPassword')} />
              </Field>
              <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
                <Input id="newPassword" type="password" invalid={!!errors.newPassword} {...register('newPassword')} />
              </Field>
              <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm?.message}>
                <Input id="confirm" type="password" invalid={!!errors.confirm} {...register('confirm')} />
              </Field>
              <div>
                <Button type="submit" loading={changePassword.isPending}>
                  Update password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!disputing}
        onOpenChange={(open) => !open && setDisputing(null)}
        title="Dispute this fine"
        description={disputing ? `${disputing.reason} — ${formatGhs(disputing.amount)}` : undefined}
        confirmLabel="Submit dispute"
        destructive={false}
        loading={dispute.isPending}
        confirmDisabled={!disputeReason.trim()}
        onConfirm={onDispute}
      >
        <Field label="Why are you disputing this fine?" htmlFor="dispute-reason">
          <Input id="dispute-reason" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="e.g. I returned this on time" />
        </Field>
      </ConfirmDialog>
    </PageTransition>
  );
}
