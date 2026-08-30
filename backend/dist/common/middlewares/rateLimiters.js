"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLimiter = exports.apiLimiter = exports.authLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../../config/env");
/** Guards login/register/OTP endpoints against brute force and email-bombing. */
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.rateLimit.authWindowMin * 60 * 1000,
    max: env_1.env.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again later.' },
});
/** Looser general-purpose limiter for the rest of the API. */
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down.' },
});
/** AI Advisory endpoints hit a metered external API with real per-call cost —
 *  tighter than the general limiter on purpose. */
exports.aiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many AI requests. Please slow down and try again shortly.' },
});
//# sourceMappingURL=rateLimiters.js.map