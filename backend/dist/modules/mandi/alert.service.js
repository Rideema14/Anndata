"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAlerts = listAlerts;
exports.createAlert = createAlert;
exports.updateAlert = updateAlert;
exports.deleteAlert = deleteAlert;
exports.checkAlertsForPrice = checkAlertsForPrice;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const notification_service_1 = require("../notification/notification.service");
const logger_1 = __importDefault(require("../../common/utils/logger"));
const RETRIGGER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // don't re-notify the same alert more than once/day
async function listAlerts(userId) {
    return prisma_1.default.mandiPriceAlert.findMany({
        where: { userId },
        include: { crop: true, mandi: true },
        orderBy: { createdAt: 'desc' },
    });
}
async function createAlert(userId, data) {
    const crop = await prisma_1.default.crop.findUnique({ where: { id: data.cropId } });
    if (!crop)
        throw ApiError_1.default.badRequest('cropId does not exist.');
    if (data.mandiId) {
        const mandi = await prisma_1.default.mandi.findUnique({ where: { id: data.mandiId } });
        if (!mandi)
            throw ApiError_1.default.badRequest('mandiId does not exist.');
    }
    return prisma_1.default.mandiPriceAlert.create({ data: { ...data, userId } });
}
async function getOwnAlert(userId, alertId) {
    const alert = await prisma_1.default.mandiPriceAlert.findFirst({ where: { id: alertId, userId } });
    if (!alert)
        throw ApiError_1.default.notFound('Alert not found.');
    return alert;
}
async function updateAlert(userId, alertId, data) {
    await getOwnAlert(userId, alertId);
    return prisma_1.default.mandiPriceAlert.update({ where: { id: alertId }, data });
}
async function deleteAlert(userId, alertId) {
    await getOwnAlert(userId, alertId);
    await prisma_1.default.mandiPriceAlert.delete({ where: { id: alertId } });
}
function priceForType(price, type) {
    if (type === 'MIN')
        return Number(price.minPrice);
    if (type === 'MAX')
        return Number(price.maxPrice);
    return Number(price.modalPrice);
}
function conditionMet(condition, actual, threshold) {
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
async function checkAlertsForPrice(price) {
    try {
        const candidates = await prisma_1.default.mandiPriceAlert.findMany({
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
            if (!conditionMet(alert.condition, actual, Number(alert.thresholdPrice)))
                continue;
            if (alert.lastTriggeredAt && now.getTime() - alert.lastTriggeredAt.getTime() < RETRIGGER_COOLDOWN_MS) {
                continue;
            }
            // eslint-disable-next-line no-await-in-loop
            await prisma_1.default.mandiPriceAlert.update({ where: { id: alert.id }, data: { lastTriggeredAt: now } });
            const mandiLabel = alert.mandi ? alert.mandi.name : 'a mandi';
            const directionWord = alert.condition === 'ABOVE' ? 'risen to' : 'fallen to';
            // eslint-disable-next-line no-await-in-loop
            await (0, notification_service_1.notifyUser)({
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
    }
    catch (err) {
        // Alert evaluation must never block price ingestion.
        const message = err instanceof Error ? err.message : String(err);
        logger_1.default.error(`checkAlertsForPrice failed for priceId=${price.id}: ${message}`);
    }
}
//# sourceMappingURL=alert.service.js.map