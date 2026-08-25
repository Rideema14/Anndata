import cron from 'node-cron';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { syncTracking } from '../modules/order/tracking.service';
import logger from '../common/utils/logger';

/**
 * Periodically polls for shipment tracking updates on all active orders
 * that have a tracking number. Runs at the interval set by TRACKING_POLL_MINUTES.
 */
export function startTrackingCron() {
  const intervalMinutes = env.tracking.pollIntervalMinutes;
  const expression = `*/${intervalMinutes} * * * *`;

  logger.info(`[TrackingCron] Starting shipment tracking cron — every ${intervalMinutes} minute(s)${env.tracking.simulate ? ' (SIMULATION MODE)' : ''}`);

  cron.schedule(expression, async () => {
    try {
      // Find all orders that have tracking info and are not in a terminal state
      const orders = await prisma.order.findMany({
        where: {
          trackingNumber: { not: null },
          trackingCarrier: { not: null },
          status: { notIn: ['DELIVERED', 'CANCELLED', 'RETURNED'] },
        },
        select: { id: true, orderNumber: true },
      });

      if (orders.length === 0) return;

      logger.info(`[TrackingCron] Syncing tracking for ${orders.length} order(s)...`);

      for (const order of orders) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await syncTracking(order.id);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error(`[TrackingCron] Failed to sync ${order.orderNumber}: ${message}`);
        }
      }

      logger.info('[TrackingCron] Sync cycle complete.');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`[TrackingCron] Cycle error: ${message}`);
    }
  });
}
