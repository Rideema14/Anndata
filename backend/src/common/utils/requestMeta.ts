import type { Request } from 'express';

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

/** Extracts client IP/User-Agent for login history & refresh token records. */
export function getRequestMeta(req: Request): RequestMeta {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0]?.trim() : undefined;

  return {
    ipAddress: forwardedIp || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}
