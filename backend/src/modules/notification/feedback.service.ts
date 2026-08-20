import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { notifyUser } from './notification.service';
import type { FeedbackInput, ListFeedbackQuery, RespondFeedbackInput } from './notification.validation';

export async function submitFeedback(userId: string | undefined, data: FeedbackInput) {
  return prisma.feedback.create({ data: { ...data, userId: userId || null } });
}

export async function listFeedback(query: ListFeedbackQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.FeedbackWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.category) where.category = query.category;

  const [items, totalItems] = await Promise.all([
    prisma.feedback.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.feedback.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getMyFeedback(userId: string, query: ListFeedbackQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.FeedbackWhereInput = { userId };

  const [items, totalItems] = await Promise.all([
    prisma.feedback.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.feedback.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function respondToFeedback(id: string, { status, adminResponse }: RespondFeedbackInput) {
  const feedback = await prisma.feedback.findUnique({ where: { id } });
  if (!feedback) throw ApiError.notFound('Feedback not found.');

  const updated = await prisma.feedback.update({ where: { id }, data: { status, adminResponse } });

  if (feedback.userId && adminResponse) {
    await notifyUser({
      userId: feedback.userId,
      type: 'GENERAL',
      title: 'We responded to your feedback',
      message: adminResponse,
      relatedEntityType: 'FEEDBACK',
      relatedEntityId: feedback.id,
      email: {
        subject: `Re: ${feedback.subject}`,
        html: `<p>Hi,</p><p>We reviewed your feedback and here's our response:</p><blockquote>${adminResponse}</blockquote>`,
      },
    });
  }

  return updated;
}
