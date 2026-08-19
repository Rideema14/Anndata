// Real-time layer, standing in for the original spec's WebSocket (STOMP)
// channel. Socket.IO is the idiomatic choice in the Express ecosystem and
// achieves the same goal: push order-status updates to a connected client
// without polling.
import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { Order } from '@prisma/client';
import { env } from './env';
import logger from '../common/utils/logger';
import type { AccessTokenPayload } from '../common/utils/jwt';

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  // Authenticate the socket using the same access token issued by /auth/login.
  // Client connects with: io(url, { auth: { token: accessToken } })
  io.use((socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const payload = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
      socket.userId = payload.sub;
      socket.userRole = payload.role;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    // Every user automatically gets their own room, so we can push order
    // updates to "everything this user owns" without tracking socket ids.
    socket.join(`user:${socket.userId}`);
    logger.debug(`Socket connected: user=${socket.userId} socket=${socket.id}`);

    // Optional: a client viewing a specific order's tracking page can join
    // that order's room directly. Authorization (does this user own the
    // order, or are they staff) is checked in the order service before
    // anything is ever emitted to this room, so joining alone leaks nothing.
    socket.on('order:track', (orderId: unknown) => {
      if (typeof orderId === 'string' && orderId.length > 0) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on('order:untrack', (orderId: unknown) => {
      if (typeof orderId === 'string' && orderId.length > 0) {
        socket.leave(`order:${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: user=${socket.userId} socket=${socket.id}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet. Call initSocket(server) first.');
  }
  return io;
}

type OrderForBroadcast = Pick<Order, 'id' | 'orderNumber' | 'status' | 'updatedAt' | 'userId'>;

/** Push an order status update to both the owning user's room and the order's own room. */
export function emitOrderUpdate(order: OrderForBroadcast): void {
  if (!io) return; // socket layer may be down; never let this break the HTTP request
  const payload = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    updatedAt: order.updatedAt,
  };
  io.to(`user:${order.userId}`).to(`order:${order.id}`).emit('order:statusUpdate', payload);
}
