import http from 'http';
import { validateEnv, env } from './config/env';
import { startKeepAliveCron } from './jobs/cron';

// IMPORTANT: this must run before any other local module loads. TypeScript
// compiles `import` statements to hoisted `require()` calls at the top of the
// file — writing `import app from './app'` further down would NOT actually
// defer loading app.ts (and everything it pulls in: mailer, Razorpay,
// Cloudinary) until after this check. Using plain `require()` here instead
// keeps the load order exactly as written, so a missing required env var
// exits the process before any other module's initialization code runs.
validateEnv();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('./app').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisma = require('./config/prisma').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { initSocket } = require('./config/socket');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require('./common/utils/logger').default;

const {startMetadataSync} = require("./jobs/metadataSync")
const {startMandiDailyCron} = require("./jobs/mandiDailyCron")

const server = http.createServer(app);
initSocket(server);

server.listen(env.port, () => {
  logger.info(`Agri Marketplace API listening on port ${env.port} [${env.nodeEnv}]`);
  logger.info(`Swagger docs: http://localhost:${env.port}/api-docs`);
  
  if (env.nodeEnv === 'production') {
    // startMetadataSync();
    startKeepAliveCron();
    startMandiDailyCron();
  }
});

async function shutdown(signal: string) {
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
