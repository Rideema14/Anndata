import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import asyncHandler from './asyncHandler';
import type { AccessTokenPayload } from '../utils/jwt';

/**
 * Verifies the Bearer access token and attaches the authenticated user to
 * req.user. Rejects if the user account has since been deactivated.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or malformed Authorization header.');
  }

  const token = header.split(' ')[1];

  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
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
export const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && user.isActive) req.user = user;
  } catch (err) {
    // ignore — treat as anonymous
  }
  next();
});
