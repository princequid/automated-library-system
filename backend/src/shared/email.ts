// backend/src/shared/email.ts
// Email dispatch stub. For now it logs to the console so due-date reminders and
// other notifications are observable in development.
//
// PRODUCTION: wire a real provider here (SendGrid, AWS SES, Postmark, ...).
// Replace the body of sendEmail with the provider's SDK call; nothing else in
// the codebase needs to change because callers only depend on this signature.
import { logger } from '../config/logger';

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  logger.info(`[email:stub] -> ${to} | ${subject}\n${body}`);
  // TODO: integrate real email provider (SendGrid / SES). Currently a no-op log.
}
