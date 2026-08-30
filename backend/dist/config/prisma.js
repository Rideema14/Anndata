"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Single shared Prisma client for the whole app (connection pooling is
// handled internally by Prisma — do not instantiate PrismaClient anywhere else).
const client_1 = require("@prisma/client");
const env_1 = require("./env");
const prisma = new client_1.PrismaClient({
    log: env_1.env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});
exports.default = prisma;
//# sourceMappingURL=prisma.js.map