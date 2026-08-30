"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAudit = recordAudit;
const prisma_1 = __importDefault(require("../../config/prisma"));
const logger_1 = __importDefault(require("../../common/utils/logger"));
/**
 * Appends one row to the shipment audit trail (requirement #12). Never
 * throws — an audit-log failure should never break the request that
 * triggered it, same reasoning as notifyUser() in the notification module.
 * Callers should still `await` this so the log write happens before the
 * response is sent (ordering matters for an audit trail), just not treat a
 * rejection as fatal.
 */
async function recordAudit(input) {
    try {
        await prisma_1.default.shipmentAuditLog.create({
            data: {
                orderId: input.orderId,
                shipmentId: input.shipmentId ?? undefined,
                action: input.action,
                actorId: input.actorId ?? undefined,
                actorRole: input.actorRole,
                source: input.source,
                previousState: input.previousState ?? undefined,
                newState: input.newState ?? undefined,
                metadata: input.metadata,
            },
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger_1.default.error(`recordAudit failed for orderId=${input.orderId} action=${input.action}: ${message}`);
    }
}
//# sourceMappingURL=auditLog.service.js.map