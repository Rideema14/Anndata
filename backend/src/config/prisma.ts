// Single shared Prisma client for the whole app (connection pooling is
// handled internally by Prisma — do not instantiate PrismaClient anywhere else).
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
