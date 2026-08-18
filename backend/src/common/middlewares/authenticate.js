const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const prisma = require('../../config/prisma');
const { env } = require('../../config/env');
const asyncHandler = require('./asyncHandler');

/**
 * Verifies the Bearer access token and attaches the authenticated user to
 * req.user. Rejects if the user account has since been deactivated.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header.');
  }

  const token = header.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired.');
    }
    throw ApiError.unauthorized('Invalid access token.');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account no longer exists or has been deactivated.');
  }

  req.user = user;
  next();
});

/**
 * Like authenticate, but does not reject when no token is present —
 * useful for endpoints that behave differently for logged-in vs anonymous
 * users (e.g. product listing showing "in your wishlist" when logged in).
 */
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.jwt.accessSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && user.isActive) req.user = user;
  } catch (err) {
    // ignore — treat as anonymous
  }
  next();
});

module.exports = { authenticate, optionalAuthenticate };
