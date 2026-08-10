// backend/src/shared/email.ts
// Real SMTP delivery via nodemailer when SMTP_HOST/PORT/USER/PASS/FROM are all
// set in the environment - works with any SMTP provider (Gmail, SendGrid's SMTP
// relay, Mailtrap, a university's own mail server, ...), so nothing here is
// locked to one vendor's proprietary SDK. Falls back to the original
// console-log stub, unchanged, when any of those env vars is missing - the app
// behaves identically to before until real credentials are supplied.
import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../config/logger';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
const configured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);

let transporter: Transporter | null = null;
let warnedOnce = false;

if (configured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  logger.info(`[email] SMTP configured (${SMTP_HOST}:${SMTP_PORT}) - real email delivery enabled.`);
}

export async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  if (!transporter) {
    if (!warnedOnce) {
      logger.info(
        '[email:stub] SMTP_HOST/PORT/USER/PASS/FROM not fully set - emails are logged, not sent. See .env.example.'
      );
      warnedOnce = true;
    }
    logger.info(`[email:stub] -> ${to} | ${subject}\n${body}`);
    return;
  }

  await transporter.sendMail({ from: SMTP_FROM, to, subject, text: body });
}
