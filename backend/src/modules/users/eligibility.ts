// backend/src/modules/users/eligibility.ts
// Borrowing-eligibility rules in one place. Both the Users module (GET
// /users/:id/eligibility) and the Circulation module (issue) call this so the
// definition of "eligible" is identical across the whole system.
import { prisma } from '../../config/database';
import { settingsService } from '../settings/settings.service';
import { AppError } from '../../shared/appError';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  active_loans: number;
  loan_limit: number;
  outstanding_fines: number;
  blocking_threshold: number;
}

export async function checkEligibility(userId: string): Promise<EligibilityResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const loanLimit = await settingsService.getNumber('loan_limit');

  const activeLoans = await prisma.loan.count({ where: { user_id: userId, returned_at: null } });

  const fineAgg = await prisma.fine.aggregate({
    where: { user_id: userId, paid: false, waived: false },
    _sum: { amount: true },
  });
  const outstanding = Number(fineAgg._sum.amount ?? 0);
  const threshold = await settingsService.getNumber('fine_blocking_threshold_ghs');

  const base = {
    active_loans: activeLoans,
    loan_limit: loanLimit,
    outstanding_fines: outstanding,
    blocking_threshold: threshold,
  };

  if (activeLoans >= loanLimit) {
    return { ...base, eligible: false, reason: `Loan limit reached (${activeLoans}/${loanLimit})` };
  }

  if (outstanding >= threshold) {
    return {
      ...base,
      eligible: false,
      reason: `Outstanding fines: GHS ${outstanding.toFixed(2)}. Pay before borrowing.`,
    };
  }

  return { ...base, eligible: true };
}
