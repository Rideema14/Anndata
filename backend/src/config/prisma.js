// Single shared Prisma client for the whole app (connection pooling is
// handled internally by Prisma — do not instantiate PrismaClient anywhere else).
const { PrismaClient } = require('@prisma/client');
const { env } = require('./env');

const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
