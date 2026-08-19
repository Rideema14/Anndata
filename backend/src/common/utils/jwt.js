const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { env } = require('../../config/env');

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

/**
 * Refresh tokens are opaque random strings, NOT JWTs. We only ever store a
 * SHA-256 hash of the token in the database (see RefreshToken model), so a
 * leaked database dump can't be replayed as a valid refresh token.
 */
function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

/** Converts a duration string like "30d" / "15m" into a JS Date in the future. */
function expiryDateFromNow(durationStr) {
  const match = /^(\d+)([smhd])$/.exec(durationStr);
  if (!match) throw new Error(`Invalid duration string: ${durationStr}`);
  const [, amountStr, unit] = match;
  const amount = parseInt(amountStr, 10);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return new Date(Date.now() + amount * unitMs);
}

module.exports = {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  expiryDateFromNow,
};
