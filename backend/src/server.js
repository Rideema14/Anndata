const http = require('http');
const { validateEnv, env } = require('./config/env');

validateEnv();

const app = require('./app');
const prisma = require('./config/prisma');
const { initSocket } = require('./config/socket');
const logger = require('./common/utils/logger');

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
  logger.info(`Agri Marketplace API listening on port ${env.port} [${env.nodeEnv}]`);
  logger.info(`Swagger docs: http://localhost:${env.port}/api-docs`);
});

async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Shutdown complete.');
    process.exit(0);
  });
  // Force-exit if graceful shutdown hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection:', err);
});
