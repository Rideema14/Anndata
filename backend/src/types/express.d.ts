// Declaration-merging augmentations for third-party types, so `req.user`,
// `req.rawBody`, and the custom Socket.IO fields type-check everywhere
// without casting.
import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` / `optionalAuthenticate` middleware. */
      user?: User;
      /** Raw request bytes, captured by the express.json() verify hook in app.ts —
       *  required for the Razorpay webhook's HMAC signature check. */
      rawBody?: Buffer;
    }
  }
}

declare module 'socket.io' {
  interface Socket {
    userId?: string;
    userRole?: string;
  }
}

export {};
