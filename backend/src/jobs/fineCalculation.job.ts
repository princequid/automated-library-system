// backend/src/jobs/fineCalculation.job.ts
// Hourly ('0 * * * *'): for every open, overdue loan, compute the CURRENT accrued
// fine and upsert it incrementally (never double-charging), honouring the grace
// period and the max cap.
import { differenceInCalendarDays } from 'date-fns';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { settingsService } from '../modules/settings/settings.service';
import { resolveMemberLevel } from '../shared/memberLevel';
import { notificationsService } from '../modules/notifications/notifications.service';
import { logger } from '../config/logger';

export async function runFineCalculation(): Promise<void> {
  const now = new Date();
  const overdueLoans = await prisma.loan.findMany({
    where: { returned_at: null, due_date: { lt: now } },
    include: { user: true, fines: true },
  });
  if (overdueLoans.length === 0) return;

  const grace = await settingsService.getNumber('fine_grace_period_days');
  const cap = await settingsService.getNumber('fine_max_cap_ghs');
  let touched = 0;

  for (const loan of overdueLoans) {
    const daysOverdue = differenceInCalendarDays(now, loan.due_date) - grace;
    if (daysOverdue <= 0) continue;

    const level = resolveMemberLevel(loan.user);
    const rate = await settingsService.getNumber(`fine_rate_${level}`);
    const accrued = Math.min(daysOverdue * rate, cap);

    // Find the auto-generated overdue fine for this loan (one per loan).
    const existing = loan.fines.find((f) => f.reason.includes('overdue') && !f.paid && !f.waived);

    if (!existing) {
      if (accrued > 0) {
        const fine = await prisma.fine.create({
          data: {
            loan_id: loan.id,
            user_id: loan.user_id,
            amount: new Prisma.Decimal(accrued.toFixed(2)),
            reason: `${daysOverdue} day(s) overdue`,
          },
        });
        touched += 1;
        // First time this loan crosses into overdue - the moment the audit
        // flagged as having no notification at all, distinct from the
        // existing 3-day/1-day upcoming-due reminders.
        await notificationsService.notify({
          userId: loan.user_id,
          type: 'loan_overdue',
          title: 'A loan is now overdue',
          body: `Your loan is ${daysOverdue} day(s) overdue and has accrued a GHS ${accrued.toFixed(2)} fine.`,
          entityType: 'Fine',
          entityId: fine.id,
        });
      }
    } else if (Number(existing.amount) < accrued) {
      // Update to the current accrued value - incremental, not additive.
      await prisma.fine.update({
        where: { id: existing.id },
        data: { amount: new Prisma.Decimal(accrued.toFixed(2)), reason: `${daysOverdue} day(s) overdue` },
      });
      touched += 1;
    }
  }

  logger.info(`[job:fineCalculation] processed ${overdueLoans.length} overdue loan(s), updated ${touched} fine(s).`);
}
