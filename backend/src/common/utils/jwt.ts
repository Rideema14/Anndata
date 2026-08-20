import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { User } from '@prisma/client';
import { env } from '../../config/env';

export interface AccessTokenPayload {
  sub: string;
  role: string;
  email: string;
}

export function signAccessToken(user: Pick<User, 'id' | 'role' | 'email'>): string {
  const payload: AccessTokenPayload = { sub: user.id, role: user.role, email: user.email };
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as jwt.SignOptions);
}

/**
 * Refresh tokens are opaque random strings, NOT JWTs. We only ever store a
 * SHA-256 hash of the token in the database (see RefreshToken model), so a
 * leaked database dump can't be replayed as a valid refresh token.
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
}

/** Converts a duration string like "30d" / "15m" into a JS Date in the future. */
export function expiryDateFromNow(durationStr: string): Date {
  const match = /^(\d+)([smhd])$/.exec(durationStr);
  if (!match) throw new Error(`Invalid duration string: ${durationStr}`);
  const [, amountStr, unit] = match;
  const amount = parseInt(amountStr, 10);
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return new Date(Date.now() + amount * unitMs[unit]);
}
