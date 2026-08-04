// backend/src/jobs/dueDateReminder.job.ts
// Daily at 08:00 ('0 8 * * *'): email members whose loans are due in exactly 3 days
// and exactly 1 day. Uses the sendEmail stub (logs to console for now).
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { prisma } from '../config/database';
import { sendEmail } from '../shared/email';
import { logger } from '../config/logger';

async function remindForOffset(days: number): Promise<number> {
  const target = addDays(new Date(), days);
  const loans = await prisma.loan.findMany({
    where: { returned_at: null, due_date: { gte: startOfDay(target), lte: endOfDay(target) } },
    include: { user: true, copy: { include: { catalog_item: true } } },
  });

  for (const loan of loans) {
    const when = days === 1 ? 'tomorrow' : `in ${days} days`;
    await sendEmail(
      loan.user.email,
      `Library reminder: "${loan.copy.catalog_item.title}" is due ${when}`,
      `Hi ${loan.user.name},\n\nYour loan of "${loan.copy.catalog_item.title}" is due ${when} ` +
        `(${loan.due_date.toDateString()}). Please return or renew it to avoid a fine.\n\nUniversity Library`
    );
  }
  return loans.length;
}

export async function runDueDateReminder(): Promise<void> {
  const [threeDay, oneDay] = await Promise.all([remindForOffset(3), remindForOffset(1)]);
  logger.info(`[job:dueDateReminder] sent ${threeDay} (3-day) + ${oneDay} (1-day) reminder(s).`);
}
