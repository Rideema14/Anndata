import type { MandiPrice } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { notifyUser } from '../notification/notification.service';
import logger from '../../common/utils/logger';
import type { AlertInput } from './mandi.validation';

const RETRIGGER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // don't re-notify the same alert more than once/day

export async function listAlerts(userId: string) {
  return prisma.mandiPriceAlert.findMany({
    where: { userId },
    include: { crop: true, mandi: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createAlert(userId: string, data: AlertInput) {
  const crop = await prisma.crop.findUnique({ where: { id: data.cropId } });
  if (!crop) throw ApiError.badRequest('cropId does not exist.');
  if (data.mandiId) {
    const mandi = await prisma.mandi.findUnique({ where: { id: data.mandiId } });
    if (!mandi) throw ApiError.badRequest('mandiId does not exist.');
  }

  return prisma.mandiPriceAlert.create({ data: { ...data, userId } });
}

async function getOwnAlert(userId: string, alertId: string) {
  const alert = await prisma.mandiPriceAlert.findFirst({ where: { id: alertId, userId } });
  if (!alert) throw ApiError.notFound('Alert not found.');
  return alert;
}

export async function updateAlert(userId: string, alertId: string, data: Partial<AlertInput>) {
  await getOwnAlert(userId, alertId);
  return prisma.mandiPriceAlert.update({ where: { id: alertId }, data });
}

export async function deleteAlert(userId: string, alertId: string) {
  await getOwnAlert(userId, alertId);
  await prisma.mandiPriceAlert.delete({ where: { id: alertId } });
}

function priceForType(price: MandiPrice, type: 'MIN' | 'MAX' | 'MODAL'): number {
  if (type === 'MIN') return Number(price.minPrice);
  if (type === 'MAX') return Number(price.maxPrice);
  return Number(price.modalPrice);
}

function conditionMet(condition: 'ABOVE' | 'BELOW', actual: number, threshold: number): boolean {
  return condition === 'ABOVE' ? actual >= threshold : actual <= threshold;
}

/**
 * Called right after a MandiPrice record is created (single entry, bulk
 * import, or external sync). Finds every active alert for this crop that
 * either targets this exact mandi or targets "any mandi" (mandiId null),
 * and fires a notification for each one whose threshold the new price
 * crosses — skipping alerts that already fired within the cooldown window
 * so a price sitting past the threshold doesn't spam the user on every tick.
 */
export async function checkAlertsForPrice(price: MandiPrice) {
  try {
    const candidates = await prisma.mandiPriceAlert.findMany({
      where: {
        cropId: price.cropId,
        isActive: true,
        OR: [{ mandiId: price.mandiId }, { mandiId: null }],
      },
      include: { crop: true, mandi: true },
    });

    const now = new Date();

    for (const alert of candidates) {
      const actual = priceForType(price, alert.priceType);
      if (!conditionMet(alert.condition, actual, Number(alert.thresholdPrice))) continue;

      if (alert.lastTriggeredAt && now.getTime() - alert.lastTriggeredAt.getTime() < RETRIGGER_COOLDOWN_MS) {
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      await prisma.mandiPriceAlert.update({ where: { id: alert.id }, data: { lastTriggeredAt: now } });

      const mandiLabel = alert.mandi ? alert.mandi.name : 'a mandi';
      const directionWord = alert.condition === 'ABOVE' ? 'risen to' : 'fallen to';

      // eslint-disable-next-line no-await-in-loop
      await notifyUser({
        userId: alert.userId,
        type: 'PRICE_ALERT',
        title: `${alert.crop.name} price alert triggered`,
        message: `The ${alert.priceType.toLowerCase()} price of ${alert.crop.name} at ${mandiLabel} has ${directionWord} ₹${actual}/${alert.crop.unit ?? 'Quintal'}, crossing your threshold of ₹${alert.thresholdPrice}.`,
        relatedEntityType: 'MANDI_PRICE_ALERT',
        relatedEntityId: alert.id,
        email: {
          subject: `Price alert: ${alert.crop.name}`,
          html: `<p>The ${alert.priceType.toLowerCase()} price of <strong>${alert.crop.name}</strong> at <strong>${mandiLabel}</strong> has ${directionWord} ₹${actual}, crossing your alert threshold of ₹${alert.thresholdPrice}.</p>`,
        },
      });
    }
  } catch (err) {
    // Alert evaluation must never block price ingestion.
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`checkAlertsForPrice failed for priceId=${price.id}: ${message}`);
  }
}
