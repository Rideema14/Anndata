"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequestMeta = getRequestMeta;
/** Extracts client IP/User-Agent for login history & refresh token records. */
function getRequestMeta(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const forwardedIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : undefined;
    return {
        ipAddress: forwardedIp || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
    };
}
//# sourceMappingURL=requestMeta.js.map