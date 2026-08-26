import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { sendMail } from '../../config/mailer';
import { otpEmailHtml } from './otpEmail.template';
import { signAccessToken, generateRefreshToken, hashToken, expiryDateFromNow } from '../../common/utils/jwt';
import { generateOtp, hashOtp, otpExpiryDate } from '../../common/utils/otp';
import { env } from '../../config/env';
import logger from '../../common/utils/logger';
import type { RequestMeta } from '../../common/utils/requestMeta';

const SALT_ROUNDS = 10;
const MAX_OTP_ATTEMPTS = 5;

const googleClient = new OAuth2Client(env.google.clientId);

export type SafeUser = Omit<User, 'passwordHash' | 'otpCodeHash' | 'otpExpiresAt' | 'otpPurpose' | 'otpAttempts'>;

export function sanitizeUser(user: User): SafeUser {
  const { passwordHash, otpCodeHash, otpExpiresAt, otpPurpose, otpAttempts, ...safe } = user;
  return safe;
}

async function issueTokenPair(user: User, meta: RequestMeta = {}) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: expiryDateFromNow(env.jwt.refreshExpiresIn),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  return { accessToken, refreshToken };
}

async function recordLogin(userId: string, meta: RequestMeta, success: boolean, reason?: string) {
  await prisma.loginHistory.create({
    data: { userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent, success, reason },
  });
}

/**
 * Generates and stores a fresh OTP, then attempts to email it. The DB write
 * happens first and always sticks — if the SMTP send afterwards fails
 * (bad credentials, provider outage, network blip), we log it and return
 * `false` instead of throwing. Otherwise a purely transient mail problem
 * would blow up `register`/`resendOtp`/`forgotPassword` *after* the account
 * (and OTP hash) were already committed, which is exactly what produced the
 * confusing "created in the database but the frontend shows an error" bug:
 * the user really was registered, but the request still rejected.
 */
async function sendOtpEmail(user: User, purpose: 'REGISTER' | 'RESET_PASSWORD'): Promise<boolean> {
  const otp = generateOtp();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCodeHash: hashOtp(otp),
      otpExpiresAt: otpExpiryDate(),
      otpPurpose: purpose,
      otpAttempts: 0,
    },
  });

  try {
    await sendMail({
      to: user.email,
      subject: purpose === 'RESET_PASSWORD' ? 'Your password reset code' : 'Verify your email',
      html: otpEmailHtml({ name: user.name, otp, purpose }),
    });
    return true;
  } catch (err) {
    logger.error(`Failed to send ${purpose} OTP email to ${user.email}`, err);
    return false;
  }
}

interface RegisterInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export async function register({ name, email, phone, password }: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing && existing.isEmailVerified) {
    throw ApiError.conflict('An account with this email already exists. Try logging in.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { name, phone, passwordHash },
      })
    : await prisma.user.create({
        data: { name, email, phone, passwordHash },
      });

  // The account is now safely in the database no matter what happens next —
  // an email hiccup below must never turn into a "registration failed"
  // error for something that already succeeded.
  const emailSent = await sendOtpEmail(user, 'REGISTER');

  return {
    message: emailSent
      ? 'Registration started. Check your email for a verification code.'
      : "Account created, but we couldn't send the verification email right now. Use Resend Code on the next screen.",
    email: user.email,
    emailSent,
  };
}

function checkOtp(user: User, purpose: 'REGISTER' | 'RESET_PASSWORD', otp: string): string | null {
  if (!user.otpCodeHash || user.otpPurpose !== purpose) {
    return 'No pending verification code for this request. Please request a new one.';
  }
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    return 'Too many incorrect attempts. Please request a new code.';
  }
  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    return 'This code has expired. Please request a new one.';
  }
  if (hashOtp(otp) !== user.otpCodeHash) {
    return 'Incorrect code.';
  }
  return null;
}

export async function verifyRegistrationOtp({ email, otp }: { email: string; otp: string }, meta: RequestMeta = {}) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.badRequest('No pending verification code for this request. Please request a new one.');
  }

  const otpError = checkOtp(user, 'REGISTER', otp);
  if (otpError) {
    await prisma.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
    throw ApiError.badRequest(otpError);
  }

  const verifiedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      otpCodeHash: null,
      otpExpiresAt: null,
      otpPurpose: null,
      otpAttempts: 0,
    },
  });

  // Every user gets exactly one cart, provisioned the moment their account becomes active.
  await prisma.cart.upsert({
    where: { userId: verifiedUser.id },
    update: {},
    create: { userId: verifiedUser.id },
  });

  const tokens = await issueTokenPair(verifiedUser, meta);
  await recordLogin(verifiedUser.id, meta, true, 'register');

  return { user: sanitizeUser(verifiedUser), ...tokens };
}

export async function resendOtp({ email, purpose }: { email: string; purpose: 'REGISTER' | 'RESET_PASSWORD' }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Don't reveal whether the account exists — always return the same message.
  const genericResponse = { message: 'If that email needs a code, we just sent one.' };

  if (!user) return genericResponse;
  if (purpose === 'REGISTER' && user.isEmailVerified) return genericResponse;
  if (purpose === 'RESET_PASSWORD' && !user.passwordHash) return genericResponse; // Google-only account

  await sendOtpEmail(user, purpose);
  return genericResponse;
}

export async function login({ email, password }: { email: string; password: string }, meta: RequestMeta = {}) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    await recordLogin(user.id, meta, false, 'bad_password');
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (!user.isEmailVerified) {
    throw ApiError.forbidden('Please verify your email before logging in.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated.');
  }

  const tokens = await issueTokenPair(user, meta);
  await recordLogin(user.id, meta, true, 'password');

  return { user: sanitizeUser(user), ...tokens };
}

export async function googleAuth({ idToken }: { idToken: string }, meta: RequestMeta = {}) {
  if (!env.google.clientId) {
    throw ApiError.internal('Google sign-in is not configured on this server.');
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({ idToken, audience: env.google.clientId });
  } catch (err) {
    throw ApiError.unauthorized('Invalid Google token.');
  }

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    throw ApiError.unauthorized('Google token did not include an email address.');
  }

  let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (user) {
      // Existing local account signing in with Google for the first time — link it.
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          googlePicture: payload.picture,
          isEmailVerified: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          googleId: payload.sub,
          googlePicture: payload.picture,
          authProvider: 'GOOGLE',
          isEmailVerified: true,
        },
      });
      await prisma.cart.create({ data: { userId: user.id } });
    }
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated.');
  }

  const tokens = await issueTokenPair(user, meta);
  await recordLogin(user.id, meta, true, 'google');

  return { user: sanitizeUser(user), ...tokens };
}

export async function refreshTokens({ refreshToken }: { refreshToken: string }, meta: RequestMeta = {}) {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token is invalid or has expired. Please log in again.');
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account no longer exists or has been deactivated.');
  }

  // Rotation: this refresh token can never be used again, even if replayed.
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const tokens = await issueTokenPair(user, meta);
  return { user: sanitizeUser(user), ...tokens };
}

export async function logout({ refreshToken }: { refreshToken?: string }) {
  if (!refreshToken) return { message: 'Logged out.' };
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
  return { message: 'Logged out.' };
}

export async function forgotPassword({ email }: { email: string }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const genericResponse = { message: 'If that email is registered, a reset code has been sent.' };

  if (!user || !user.passwordHash) return genericResponse; // don't leak existence / Google-only accounts

  await sendOtpEmail(user, 'RESET_PASSWORD');
  return genericResponse;
}

export async function resetPassword({ email, otp, newPassword }: { email: string; otp: string; newPassword: string }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw ApiError.badRequest('No pending verification code for this request. Please request a new one.');
  }

  const otpError = checkOtp(user, 'RESET_PASSWORD', otp);
  if (otpError) {
    await prisma.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
    throw ApiError.badRequest(otpError);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      otpCodeHash: null,
      otpExpiresAt: null,
      otpPurpose: null,
      otpAttempts: 0,
    },
  });

  // Password changed — kill every existing session on every device.
  await prisma.refreshToken.updateMany({ where: { userId: user.id, revoked: false }, data: { revoked: true } });

  return { message: 'Password has been reset. Please log in again.' };
}
