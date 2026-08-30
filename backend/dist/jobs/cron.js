"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startKeepAliveCron = startKeepAliveCron;
const node_cron_1 = __importDefault(require("node-cron"));
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../common/utils/logger"));
function startKeepAliveCron() {
    // Run every 15 minutes
    node_cron_1.default.schedule('*/10 * * * *', async () => {
        try {
            const url = process.env.BASE_URL || `http://localhost:${env_1.env.port}/`;
            logger_1.default.info(`Running 5-min keep-alive ping to ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
                logger_1.default.error(`Keep-alive ping failed with status: ${response.status}`);
            }
            else {
                logger_1.default.info('Keep-alive ping successful');
            }
        }
        catch (error) {
            logger_1.default.error('Error during keep-alive ping:', error);
        }
    });
}
//# sourceMappingURL=cron.js.map