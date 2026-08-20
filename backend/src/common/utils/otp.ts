import crypto from 'crypto';
import { env } from '../../config/env';

export function generateOtp(): string {
  const min = 10 ** (env.otp.length - 1);
  const max = 10 ** env.otp.length - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export function hashOtp(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + env.otp.expiryMinutes * 60_000);
}
