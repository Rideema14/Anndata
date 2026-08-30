"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const prisma_1 = __importDefault(require("../../config/prisma"));
const env_1 = require("../../config/env");
const asyncHandler_1 = __importDefault(require("./asyncHandler"));
/**
 * Verifies the Bearer access token and attaches the authenticated user to
 * req.user. Rejects if the user account has since been deactivated.
 */
exports.authenticate = (0, asyncHandler_1.default)(async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        throw ApiError_1.default.unauthorized('Missing or malformed Authorization header.');
    }
    const token = header.split(' ')[1];
    let payload;
    try {
        payload = jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw ApiError_1.default.unauthorized('Access token expired.');
        }
        throw ApiError_1.default.unauthorized('Invalid access token.');
    }
    const user = await prisma_1.default.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
        throw ApiError_1.default.unauthorized('Account no longer exists or has been deactivated.');
    }
    req.user = user;
    next();
});
/**
 * Like authenticate, but does not reject when no token is present —
 * useful for endpoints that behave differently for logged-in vs anonymous
 * users (e.g. product listing showing "in your wishlist" when logged in).
 */
exports.optionalAuthenticate = (0, asyncHandler_1.default)(async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
        return next();
    try {
        const token = header.split(' ')[1];
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
        const user = await prisma_1.default.user.findUnique({ where: { id: payload.sub } });
        if (user && user.isActive)
            req.user = user;
    }
    catch (err) {
        // ignore — treat as anonymous
    }
    next();
});
//# sourceMappingURL=authenticate.js.map