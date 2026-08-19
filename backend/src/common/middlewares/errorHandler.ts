import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import { env } from '../../config/env';

/** Maps known Prisma error codes to friendly ApiErrors. */
function fromPrismaError(err: unknown): ApiError | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = err.meta?.target;
        const fields = Array.isArray(target) ? target.join(', ') : 'field';
        return ApiError.conflict(`A record with this ${fields} already exists.`);
      }
      case 'P2025':
        return ApiError.notFound('Record not found.');
      case 'P2003':
        return ApiError.badRequest('This action references a record that does not exist.');
      default:
        return ApiError.badRequest('Database request failed.');
    }
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest('Invalid data sent to the database layer.');
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  let error: ApiError | unknown = err;

  if (!(error instanceof ApiError)) {
    error = fromPrismaError(err) || error;
  }

  if (!(error instanceof ApiError)) {
    // Unexpected/programmer error — log full detail, don't leak internals to the client.
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    error = ApiError.internal(env.nodeEnv === 'development' ? message : 'Something went wrong.');
  } else if (error.statusCode >= 500) {
    logger.error(`${error.statusCode} on ${req.method} ${req.originalUrl}: ${error.message}`, err);
  }

  const finalError = error as ApiError;

  const responseBody: Record<string, unknown> = {
    success: false,
    message: finalError.message,
  };
  if (finalError.details) responseBody.details = finalError.details;
  if (env.nodeEnv === 'development' && err instanceof Error && err.stack) responseBody.stack = err.stack;

  res.status(finalError.statusCode || 500).json(responseBody);
}
