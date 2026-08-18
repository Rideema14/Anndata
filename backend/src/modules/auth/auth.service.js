const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../../config/prisma');
const ApiError = require('../../common/utils/ApiError');
const { sendMail } = require('../../config/mailer');
const { otpEmailHtml } = require('./otpEmail.template');
const {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  expiryDateFromNow,
} = require('../../common/utils/jwt');
const { generateOtp, hashOtp, otpExpiryDate } = require('../../common/utils/otp');
const { env } = require('../../config/env');

const SALT_ROUNDS = 10;
const MAX_OTP_ATTEMPTS = 5;

const googleClient = new OAuth2Client(env.google.clientId);

function sanitizeUser(user) {
  const { passwordHash, otpCodeHash, otpExpiresAt, otpPurpose, otpAttempts, ...safe } = user;
  return safe;
}

async function issueTokenPair(user, meta = {}) {
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

async function recordLogin(userId, meta, success, reason) {
  await prisma.loginHistory.create({
    data: { userId, ipAddress: meta.ipAddress, userAgent: meta.userAgent, success, reason },
  });
}

async function sendOtpEmail(user, purpose) {
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

  await sendMail({
    to: user.email,
    subject: purpose === 'RESET_PASSWORD' ? 'Your password reset code' : 'Verify your email',
    html: otpEmailHtml({ name: user.name, otp, purpose }),
  });
}

async function register({ name, email, phone, password }) {
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

  await sendOtpEmail(user, 'REGISTER');

  return { message: 'Registration started. Check your email for a verification code.', email: user.email };
}

function assertOtpValid(user, purpose, otp) {
  if (!user || !user.otpCodeHash || user.otpPurpose !== purpose) {
    throw ApiError.badRequest('No pending verification code for this request. Please request a new one.');
  }
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    throw ApiError.badRequest('Too many incorrect attempts. Please request a new code.');
  }
  if (user.otpExpiresAt < new Date()) {
    throw ApiError.badRequest('This code has expired. Please request a new one.');
  }
  if (hashOtp(otp) !== user.otpCodeHash) {
    throw ApiError.badRequest('Incorrect code.');
  }
}

async function verifyRegistrationOtp({ email, otp }, meta = {}) {
  const user = await prisma.user.findUnique({ where: { email } });

  try {
    assertOtpValid(user, 'REGISTER', otp);
  } catch (err) {
    if (user) await prisma.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
    throw err;
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

async function resendOtp({ email, purpose }) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Don't reveal whether the account exists — always return the same message.
  const genericResponse = { message: 'If that email needs a code, we just sent one.' };

  if (!user) return genericResponse;
  if (purpose === 'REGISTER' && user.isEmailVerified) return genericResponse;
  if (purpose === 'RESET_PASSWORD' && !user.passwordHash) return genericResponse; // Google-only account

  await sendOtpEmail(user, purpose);
  return genericResponse;
}

async function login({ email, password }, meta = {}) {
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

async function googleAuth({ idToken }, meta = {}) {
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
  if (!payload?.email) {
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

async function refreshTokens({ refreshToken }, meta = {}) {
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

async function logout({ refreshToken }) {
  if (!refreshToken) return { message: 'Logged out.' };
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
  return { message: 'Logged out.' };
}

async function forgotPassword({ email }) {
  const user = await prisma.user.findUnique({ where: { email } });
  const genericResponse = { message: 'If that email is registered, a reset code has been sent.' };

  if (!user || !user.passwordHash) return genericResponse; // don't leak existence / Google-only accounts

  await sendOtpEmail(user, 'RESET_PASSWORD');
  return genericResponse;
}

async function resetPassword({ email, otp, newPassword }) {
  const user = await prisma.user.findUnique({ where: { email } });

  try {
    assertOtpValid(user, 'RESET_PASSWORD', otp);
  } catch (err) {
    if (user) await prisma.user.update({ where: { id: user.id }, data: { otpAttempts: { increment: 1 } } });
    throw err;
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

module.exports = {
  sanitizeUser,
  register,
  verifyRegistrationOtp,
  resendOtp,
  login,
  googleAuth,
  refreshTokens,
  logout,
  forgotPassword,
  resetPassword,
};
