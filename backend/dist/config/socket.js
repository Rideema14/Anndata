"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
exports.emitOrderUpdate = emitOrderUpdate;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
const logger_1 = __importDefault(require("../common/utils/logger"));
let io = null;
function initSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.clientUrl,
            credentials: true,
        },
    });
    // Authenticate the socket using the same access token issued by /auth/login.
    // Client connects with: io(url, { auth: { token: accessToken } })
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                return next(new Error('Authentication token missing'));
            }
            const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
            socket.userId = payload.sub;
            socket.userRole = payload.role;
            next();
        }
        catch (err) {
            next(new Error('Invalid or expired token'));
        }
    });
    io.on('connection', (socket) => {
        // Every user automatically gets their own room, so we can push order
        // updates to "everything this user owns" without tracking socket ids.
        socket.join(`user:${socket.userId}`);
        logger_1.default.debug(`Socket connected: user=${socket.userId} socket=${socket.id}`);
        // Optional: a client viewing a specific order's tracking page can join
        // that order's room directly. Authorization (does this user own the
        // order, or are they staff) is checked in the order service before
        // anything is ever emitted to this room, so joining alone leaks nothing.
        socket.on('order:track', (orderId) => {
            if (typeof orderId === 'string' && orderId.length > 0) {
                socket.join(`order:${orderId}`);
            }
        });
        socket.on('order:untrack', (orderId) => {
            if (typeof orderId === 'string' && orderId.length > 0) {
                socket.leave(`order:${orderId}`);
            }
        });
        socket.on('disconnect', () => {
            logger_1.default.debug(`Socket disconnected: user=${socket.userId} socket=${socket.id}`);
        });
    });
    logger_1.default.info('Socket.IO initialized');
    return io;
}
function getIO() {
    if (!io) {
        throw new Error('Socket.IO has not been initialized yet. Call initSocket(server) first.');
    }
    return io;
}
/** Push an order/booking status update to both the owning user's room and the order's own room. */
function emitOrderUpdate(order) {
    if (!io)
        return; // socket layer may be down; never let this break the HTTP request
    const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt,
    };
    io.to(`user:${order.userId}`).to(`order:${order.id}`).emit('order:statusUpdate', payload);
}
//# sourceMappingURL=socket.js.map