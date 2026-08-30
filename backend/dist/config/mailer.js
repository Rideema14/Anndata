"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const env_1 = require("./env");
const logger_1 = __importDefault(require("../common/utils/logger"));
// EmailJS's SDK wraps fetch() with no timeout of its own. Nodemailer's
// direct-SMTP path had explicit 8s timeouts so a blocked/unreachable mail
// server couldn't stall register/resendOtp/forgotPassword past the
// frontend's 15s request timeout — mirror that here with the same budget.
const SEND_TIMEOUT_MS = 8_000;
async function sendMail({ to, subject, html, text }) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);
        try {
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    service_id: env_1.env.emailjs.serviceId,
                    template_id: env_1.env.emailjs.templateId,
                    user_id: env_1.env.emailjs.publicKey,
                    accessToken: env_1.env.emailjs.privateKey,
                    template_params: {
                        to_email: to,
                        subject,
                        html_body: html,
                        text_body: text || html.replace(/<[^>]+>/g, ''),
                        from_name: env_1.env.emailjs.fromName,
                    },
                }),
            });
            if (!response.ok) {
                throw new Error(`EmailJS returned ${response.status}: ${await response.text()}`);
            }
        }
        catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw new Error(`EmailJS send to ${to} timed out after ${SEND_TIMEOUT_MS}ms`);
            }
            throw err;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger_1.default.error(`Failed to send email to ${to} via EmailJS: ${message}`);
        throw err;
    }
}
//# sourceMappingURL=mailer.js.map