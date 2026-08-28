import { env } from './env';
import logger from '../common/utils/logger';

// Nodemailer previously sent mail over raw SMTP, which works fine locally
// but hangs (then times out) on Vercel — its serverless functions block
// outbound connections on SMTP ports (25/465/587). EmailJS's Send API is a
// plain HTTPS POST to api.emailjs.com, so it goes through Vercel's network
// exactly like any other fetch() call.
//
// EmailJS templates are authored in the dashboard (Email Templates > your
// template), not in code. Every mail this app sends — OTPs, order emails,
// notifications — reuses ONE generic template, so it only needs to be set
// up once. Create a template with these variables and reference them in
// its subject/body:
//   {{to_email}}    - recipient address (set this as the template's "To" field)
//   {{subject}}      - email subject
//   {{html_body}}     - full HTML body; insert as {{{html_body}}} (triple braces)
//                        in the template's HTML source so EmailJS doesn't
//                        HTML-escape the markup this app already generated
//   {{text_body}}     - plain-text fallback, in case you also want a text part
//   {{from_name}}     - display name for the From header
// See backend/.env.example for the account keys this needs.
export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// EmailJS's SDK wraps fetch() with no timeout of its own. Nodemailer's
// direct-SMTP path had explicit 8s timeouts so a blocked/unreachable mail
// server couldn't stall register/resendOtp/forgotPassword past the
// frontend's 15s request timeout — mirror that here with the same budget.
const SEND_TIMEOUT_MS = 8_000;

export async function sendMail({ to, subject, html, text }: MailMessage): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          service_id: env.emailjs.serviceId,
          template_id: env.emailjs.templateId,
          user_id: env.emailjs.publicKey,
          accessToken: env.emailjs.privateKey,
          template_params: {
            to_email: to,
            subject,
            html_body: html,
            text_body: text || html.replace(/<[^>]+>/g, ''),
            from_name: env.emailjs.fromName,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`EmailJS returned ${response.status}: ${await response.text()}`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`EmailJS send to ${to} timed out after ${SEND_TIMEOUT_MS}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to send email to ${to} via EmailJS: ${message}`);
    throw err;
  }
}