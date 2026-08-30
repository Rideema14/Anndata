"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
const client_1 = require("@prisma/client");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const logger_1 = __importDefault(require("../utils/logger"));
const env_1 = require("../../config/env");
/** Maps known Prisma error codes to friendly ApiErrors. */
function fromPrismaError(err) {
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case 'P2002': {
                const target = err.meta?.target;
                const fields = Array.isArray(target) ? target.join(', ') : 'field';
                return ApiError_1.default.conflict(`A record with this ${fields} already exists.`);
            }
            case 'P2025':
                return ApiError_1.default.notFound('Record not found.');
            case 'P2003':
                return ApiError_1.default.badRequest('This action references a record that does not exist.');
            default:
                return ApiError_1.default.badRequest('Database request failed.');
        }
    }
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        return ApiError_1.default.badRequest('Invalid data sent to the database layer.');
    }
    return null;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, req, res, next) {
    let error = err;
    if (!(error instanceof ApiError_1.default)) {
        error = fromPrismaError(err) || error;
    }
    if (!(error instanceof ApiError_1.default)) {
        // Unexpected/programmer error — log full detail, don't leak internals to the client.
        logger_1.default.error(`Unhandled error on ${req.method} ${req.originalUrl}`, err);
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        error = ApiError_1.default.internal(env_1.env.nodeEnv === 'development' ? message : 'Something went wrong.');
    }
    else if (error.statusCode >= 500) {
        logger_1.default.error(`${error.statusCode} on ${req.method} ${req.originalUrl}: ${error.message}`, err);
    }
    const finalError = error;
    const responseBody = {
        success: false,
        message: finalError.message,
    };
    if (finalError.details)
        responseBody.details = finalError.details;
    if (env_1.env.nodeEnv === 'development' && err instanceof Error && err.stack)
        responseBody.stack = err.stack;
    res.status(finalError.statusCode || 500).json(responseBody);
}
//# sourceMappingURL=errorHandler.js.map