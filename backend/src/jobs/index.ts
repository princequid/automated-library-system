// backend/src/jobs/index.ts
// Registers all scheduled background jobs with node-cron. Called once from
// server.ts at boot. Each run is wrapped so a job failure logs but never crashes
// the scheduler or the server.
import cron from 'node-cron';
import { logger } from '../config/logger';
import { runFineCalculation } from './fineCalculation.job';
import { runHoldExpiry } from './holdExpiry.job';
import { runDueDateReminder } from './dueDateReminder.job';

function safe(name: string, fn: () => Promise<void>) {
  return () => {
    fn().catch((err) => logger.error(`[job:${name}] failed: ${(err as Error).message}`));
  };
}

export function registerJobs(): void {
  // Hourly: accrue overdue fines.
  cron.schedule('0 * * * *', safe('fineCalculation', runFineCalculation));

  // Every 30 minutes: expire holds and promote the queue.
  cron.schedule('*/30 * * * *', safe('holdExpiry', runHoldExpiry));

  // Daily at 08:00: due-date reminders.
  cron.schedule('0 8 * * *', safe('dueDateReminder', runDueDateReminder));

  logger.info('Registered 3 scheduled jobs (fineCalculation, holdExpiry, dueDateReminder).');
}
