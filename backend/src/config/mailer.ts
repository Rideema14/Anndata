import nodemailer from 'nodemailer';
import { env } from './env';
import logger from '../common/utils/logger';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure, // true for 465, false for other ports (STARTTLS)
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
  // Without these, a blocked/unreachable SMTP host hangs on nodemailer's own
  // multi-minute defaults — long enough to blow past the frontend's 15s
  // request timeout even though the account row was already committed.
  // Failing fast here keeps register/resendOtp/forgotPassword responding
  // well inside that window no matter what the mail server is doing.
  connectionTimeout: 8_000,
  greetingTimeout: 8_000,
  socketTimeout: 8_000,
});

// Verify SMTP connectivity at startup so config problems surface immediately
// instead of the first time a user tries to register.
if (env.nodeEnv !== 'test') {
  transporter
    .verify()
    .then(() => logger.info('SMTP transporter ready'))
    .catch((err: Error) => logger.warn(`SMTP transporter verification failed: ${err.message}`));
}

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail({ to, subject, html, text }: MailMessage) {
  return transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  });
}
