const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { env } = require('../../config/env');

/** Maps known Prisma error codes to friendly ApiErrors. */
function fromPrismaError(err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const fields = err.meta?.target ? err.meta.target.join(', ') : 'field';
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

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    error = fromPrismaError(err) || error;
  }

  if (!(error instanceof ApiError)) {
    // Unexpected/programmer error — log full detail, don't leak internals to the client.
    logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
    error = ApiError.internal(env.nodeEnv === 'development' ? err.message : 'Something went wrong.');
  } else if (error.statusCode >= 500) {
    logger.error(`${error.statusCode} on ${req.method} ${req.originalUrl}: ${error.message}`, err);
  }

  const responseBody = {
    success: false,
    message: error.message,
  };
  if (error.details) responseBody.details = error.details;
  if (env.nodeEnv === 'development' && err.stack) responseBody.stack = err.stack;

  res.status(error.statusCode || 500).json(responseBody);
}

module.exports = errorHandler;
