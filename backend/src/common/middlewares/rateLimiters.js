const rateLimit = require('express-rate-limit');
const { env } = require('../../config/env');

/** Guards login/register/OTP endpoints against brute force and email-bombing. */
const authLimiter = rateLimit({
  windowMs: env.rateLimit.authWindowMin * 60 * 1000,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

/** Looser general-purpose limiter for the rest of the API. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

module.exports = { authLimiter, apiLimiter };
