const nodemailer = require('nodemailer');
const { env } = require('./env');
const logger = require('../common/utils/logger');

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure, // true for 465, false for other ports (STARTTLS)
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

// Verify SMTP connectivity at startup so config problems surface immediately
// instead of the first time a user tries to register.
if (env.nodeEnv !== 'test') {
  transporter
    .verify()
    .then(() => logger.info('SMTP transporter ready'))
    .catch((err) => logger.warn(`SMTP transporter verification failed: ${err.message}`));
}

/**
 * @param {{to: string, subject: string, html: string, text?: string}} message
 */
async function sendMail({ to, subject, html, text }) {
  return transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ''),
  });
}

module.exports = { sendMail };
