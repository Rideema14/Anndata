import type { NotificationType, Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { sendMail } from '../../config/mailer';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import logger from '../../common/utils/logger';
import type { ListNotificationsQuery, UpdatePreferencesInput } from './notification.validation';

async function getOrCreatePreference(userId: string) {
  let pref = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!pref) {
    pref = await prisma.notificationPreference.create({ data: { userId } });
  }
  return pref;
}

interface NotifyUserInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  email?: { subject: string; html: string };
}

/**
 * Internal helper — call this from any module (orders, payments, seller
 * verification, reviews, price alerts, ...) to notify a user. Respects the
 * user's NotificationPreference: skipped entirely if the type is muted,
 * written to the in-app feed only if inAppEnabled, emailed only if
 * emailEnabled. Never throws — a notification failure should never break
 * the calling request (e.g. an order status update should still succeed
 * even if the email send fails).
 */
export async function notifyUser({ userId, type, title, message, relatedEntityType, relatedEntityId, email }: NotifyUserInput) {
  try {
    const pref = await getOrCreatePreference(userId);
    if (pref.mutedTypes.includes(type)) return;

    if (pref.inAppEnabled) {
      await prisma.notification.create({
        data: { userId, type, title, message, relatedEntityType, relatedEntityId },
      });
    }

    if (pref.emailEnabled && email) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      if (user) {
        await sendMail({ to: user.email, subject: email.subject, html: email.html });
      }
    }
  } catch (err) {
    const message2 = err instanceof Error ? err.message : String(err);
    logger.error(`notifyUser failed for userId=${userId} type=${type}: ${message2}`);
  }
}

export async function listNotifications(userId: string, query: ListNotificationsQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.NotificationWhereInput = { userId, ...(query.unreadOnly ? { isRead: false } : {}) };

  const [items, totalItems] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.notification.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({ where: { userId, isRead: false } });
  return { unreadCount: count };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
  if (!notification) throw ApiError.notFound('Notification not found.');
  return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return { message: 'All notifications marked as read.' };
}

export async function getPreferences(userId: string) {
  return getOrCreatePreference(userId);
}

export async function updatePreferences(userId: string, data: UpdatePreferencesInput) {
  await getOrCreatePreference(userId);
  return prisma.notificationPreference.update({ where: { userId }, data });
}
