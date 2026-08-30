"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Wraps an async route handler so rejected promises are forwarded to
 * Express's error-handling middleware instead of crashing the process.
 * Usage: router.get('/x', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.default = asyncHandler;
//# sourceMappingURL=asyncHandler.js.map