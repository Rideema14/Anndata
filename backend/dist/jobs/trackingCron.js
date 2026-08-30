"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTrackingCron = startTrackingCron;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = __importDefault(require("../config/prisma"));
const env_1 = require("../config/env");
const tracking_service_1 = require("../modules/order/tracking.service");
const shipment_constants_1 = require("../modules/order/shipment.constants");
const logger_1 = __importDefault(require("../common/utils/logger"));
/**
 * Periodically polls for shipment tracking updates on every order with a
 * non-terminal Shipment. Runs at the interval set by TRACKING_POLL_MINUTES.
 * Falls back to this even when the 17TRACK webhook is configured
 * (requirement #7) — syncTracking() is fully idempotent either way.
 */
function startTrackingCron() {
    const intervalMinutes = env_1.env.tracking.pollIntervalMinutes;
    const expression = `*/${intervalMinutes} * * * *`;
    logger_1.default.info(`[TrackingCron] Starting shipment tracking cron — every ${intervalMinutes} minute(s)${env_1.env.tracking.simulate ? ' (SIMULATION MODE)' : ''}`);
    node_cron_1.default.schedule(expression, async () => {
        try {
            const shipments = await prisma_1.default.shipment.findMany({
                where: {
                    status: { notIn: shipment_constants_1.TERMINAL_SHIPMENT_STATUSES },
                    order: { status: { not: 'CANCELLED' } },
                },
                select: { orderId: true, order: { select: { orderNumber: true } } },
            });
            if (shipments.length === 0)
                return;
            logger_1.default.info(`[TrackingCron] Syncing tracking for ${shipments.length} shipment(s)...`);
            for (const shipment of shipments) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    await (0, tracking_service_1.syncTracking)(shipment.orderId);
                }
                catch (err) {
                    const message = err instanceof Error ? err.message : String(err);
                    logger_1.default.error(`[TrackingCron] Failed to sync ${shipment.order.orderNumber}: ${message}`);
                }
            }
            logger_1.default.info('[TrackingCron] Sync cycle complete.');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger_1.default.error(`[TrackingCron] Cycle error: ${message}`);
        }
    });
}
//# sourceMappingURL=trackingCron.js.map