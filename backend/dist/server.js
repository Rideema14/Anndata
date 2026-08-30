"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const env_1 = require("./config/env");
const cron_1 = require("./jobs/cron");
// IMPORTANT: this must run before any other local module loads. TypeScript
// compiles `import` statements to hoisted `require()` calls at the top of the
// file — writing `import app from './app'` further down would NOT actually
// defer loading app.ts (and everything it pulls in: mailer, Razorpay,
// Cloudinary) until after this check. Using plain `require()` here instead
// keeps the load order exactly as written, so a missing required env var
// exits the process before any other module's initialization code runs.
(0, env_1.validateEnv)();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('./app').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisma = require('./config/prisma').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { initSocket } = require('./config/socket');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const logger = require('./common/utils/logger').default;
const { startMetadataSync } = require("./jobs/metadataSync");
const { startTrackingCron } = require("./jobs/trackingCron");
const { startMandiDailyCron } = require("./jobs/mandiDailyCron");
const server = http_1.default.createServer(app);
initSocket(server);
server.listen(env_1.env.port, () => {
    logger.info(`Agri Marketplace API listening on port ${env_1.env.port} [${env_1.env.nodeEnv}]`);
    logger.info(`Swagger docs: http://localhost:${env_1.env.port}/api-docs`);
    // Start tracking cron in all environments (simulation mode works locally)
    startTrackingCron();
    if (env_1.env.nodeEnv === 'production') {
        // startMetadataSync();
        startMandiDailyCron();
        (0, cron_1.startKeepAliveCron)();
    }
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
//# sourceMappingURL=server.js.map