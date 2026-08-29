import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import logger from '../../common/utils/logger';
import type { ActorRole, AuditAction, AuditSource } from './shipment.constants';

interface RecordAuditInput {
  orderId: string;
  shipmentId?: string | null;
  action: AuditAction | string;
  actorId?: string | null;
  actorRole?: ActorRole;
  source: AuditSource;
  previousState?: string | null;
  newState?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Appends one row to the shipment audit trail (requirement #12). Never
 * throws — an audit-log failure should never break the request that
 * triggered it, same reasoning as notifyUser() in the notification module.
 * Callers should still `await` this so the log write happens before the
 * response is sent (ordering matters for an audit trail), just not treat a
 * rejection as fatal.
 */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  try {
    await prisma.shipmentAuditLog.create({
      data: {
        orderId: input.orderId,
        shipmentId: input.shipmentId ?? undefined,
        action: input.action,
        actorId: input.actorId ?? undefined,
        actorRole: input.actorRole,
        source: input.source,
        previousState: input.previousState ?? undefined,
        newState: input.newState ?? undefined,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`recordAudit failed for orderId=${input.orderId} action=${input.action}: ${message}`);
  }
}
