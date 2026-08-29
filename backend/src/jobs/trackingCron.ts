import cron from 'node-cron';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { syncTracking } from '../modules/order/tracking.service';
import { TERMINAL_SHIPMENT_STATUSES } from '../modules/order/shipment.constants';
import logger from '../common/utils/logger';

/**
 * Periodically polls for shipment tracking updates on every order with a
 * non-terminal Shipment. Runs at the interval set by TRACKING_POLL_MINUTES.
 * Falls back to this even when the 17TRACK webhook is configured
 * (requirement #7) — syncTracking() is fully idempotent either way.
 */
export function startTrackingCron() {
  const intervalMinutes = env.tracking.pollIntervalMinutes;
  const expression = `*/${intervalMinutes} * * * *`;

  logger.info(`[TrackingCron] Starting shipment tracking cron — every ${intervalMinutes} minute(s)${env.tracking.simulate ? ' (SIMULATION MODE)' : ''}`);

  cron.schedule(expression, async () => {
    try {
      const shipments = await prisma.shipment.findMany({
        where: {
          status: { notIn: TERMINAL_SHIPMENT_STATUSES },
          order: { status: { not: 'CANCELLED' } },
        },
        select: { orderId: true, order: { select: { orderNumber: true } } },
      });

      if (shipments.length === 0) return;

      logger.info(`[TrackingCron] Syncing tracking for ${shipments.length} shipment(s)...`);

      for (const shipment of shipments) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await syncTracking(shipment.orderId);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error(`[TrackingCron] Failed to sync ${shipment.order.orderNumber}: ${message}`);
        }
      }

      logger.info('[TrackingCron] Sync cycle complete.');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[TrackingCron] Cycle error: ${message}`);
    }
  });
}

