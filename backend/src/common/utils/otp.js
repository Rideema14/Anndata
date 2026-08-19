const crypto = require('crypto');
const { env } = require('../../config/env');

function generateOtp() {
  const min = 10 ** (env.otp.length - 1);
  const max = 10 ** env.otp.length - 1;
  const code = crypto.randomInt(min, max + 1).toString();
  return code;
}

function hashOtp(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function otpExpiryDate() {
  return new Date(Date.now() + env.otp.expiryMinutes * 60_000);
}

module.exports = { generateOtp, hashOtp, otpExpiryDate };
