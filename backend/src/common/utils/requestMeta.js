/** Extracts client IP/User-Agent for login history & refresh token records. */
function getRequestMeta(req) {
  return {
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

module.exports = { getRequestMeta };
