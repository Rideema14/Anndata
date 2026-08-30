"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.hashToken = hashToken;
exports.verifyAccessToken = verifyAccessToken;
exports.expiryDateFromNow = expiryDateFromNow;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../config/env");
function signAccessToken(user) {
    const payload = { sub: user.id, role: user.role, email: user.email };
    return jsonwebtoken_1.default.sign(payload, env_1.env.jwt.accessSecret, {
        expiresIn: env_1.env.jwt.accessExpiresIn,
    });
}
/**
 * Refresh tokens are opaque random strings, NOT JWTs. We only ever store a
 * SHA-256 hash of the token in the database (see RefreshToken model), so a
 * leaked database dump can't be replayed as a valid refresh token.
 */
function generateRefreshToken() {
    return crypto_1.default.randomBytes(48).toString('hex');
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
}
/** Converts a duration string like "30d" / "15m" into a JS Date in the future. */
function expiryDateFromNow(durationStr) {
    const match = /^(\d+)([smhd])$/.exec(durationStr);
    if (!match)
        throw new Error(`Invalid duration string: ${durationStr}`);
    const [, amountStr, unit] = match;
    const amount = parseInt(amountStr, 10);
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return new Date(Date.now() + amount * unitMs[unit]);
}
//# sourceMappingURL=jwt.js.map