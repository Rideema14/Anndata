import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { CreateVisitRequestInput, UpdateVisitStatusInput, ListVisitRequestsQuery } from './land.validation';

const VISIT_INCLUDE_DETAIL = {
  land: { select: { id: true, title: true, slug: true, sellerId: true, location: true } },
  buyer: { select: { id: true, name: true, phone: true, email: true } },
} satisfies Prisma.LandVisitRequestInclude;

type VisitWithDetail = Prisma.LandVisitRequestGetPayload<{ include: typeof VISIT_INCLUDE_DETAIL }>;

function assertCanView(visit: VisitWithDetail, user: User) {
  if (user.role === 'ADMIN') return;
  if (visit.buyerId === user.id) return;
  if (visit.land.sellerId === user.id) return;
  throw ApiError.forbidden('You do not have permission to view this visit request.');
}

/**
 * Buyer-initiated visit request. A buyer can only have one *live* request
 * per listing — a repeat request reschedules the existing one and puts it
 * back to PENDING, matching the "replace the previous request" behaviour
 * the frontend's LandContext already does client-side.
 */
export async function requestVisit(landId: string, buyer: User, data: CreateVisitRequestInput) {
  if (buyer.role === 'ADMIN') {
    throw ApiError.badRequest('Admin accounts cannot request land visits.');
  }

  const land = await prisma.land.findUnique({ where: { id: landId } });
  if (!land || !land.isActive) throw ApiError.notFound('Land listing not found.');
  if (land.sellerId === buyer.id) throw ApiError.badRequest('You cannot request a visit for your own listing.');

  const today = new Date(new Date().toDateString());
  if (data.visitDate < today) throw ApiError.badRequest('visitDate cannot be in the past.');

  return prisma.landVisitRequest.upsert({
    where: { landId_buyerId: { landId, buyerId: buyer.id } },
    create: {
      landId,
      buyerId: buyer.id,
      visitDate: data.visitDate,
      visitTime: data.visitTime,
      message: data.message,
      status: 'PENDING',
    },
    update: {
      visitDate: data.visitDate,
      visitTime: data.visitTime,
      message: data.message,
      status: 'PENDING',
      responseNote: null,
    },
    include: VISIT_INCLUDE_DETAIL,
  });
}

export async function listVisitRequestsForLand(landId: string, user: User, query: ListVisitRequestsQuery) {
  const land = await prisma.land.findUnique({ where: { id: landId } });
  if (!land) throw ApiError.notFound('Land listing not found.');
  if (user.role !== 'ADMIN' && land.sellerId !== user.id) {
    throw ApiError.forbidden('You do not have permission to view visit requests for this listing.');
  }

  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.LandVisitRequestWhereInput = { landId };
  if (query.status) where.status = query.status;

  const [items, totalItems] = await Promise.all([
    prisma.landVisitRequest.findMany({ where, include: VISIT_INCLUDE_DETAIL, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.landVisitRequest.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function myVisitRequests(buyer: User, query: ListVisitRequestsQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.LandVisitRequestWhereInput = { buyerId: buyer.id };
  if (query.status) where.status = query.status;

  const [items, totalItems] = await Promise.all([
    prisma.landVisitRequest.findMany({ where, include: VISIT_INCLUDE_DETAIL, orderBy: { createdAt: 'desc' }, skip, take }),
    prisma.landVisitRequest.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getVisitRequestById(id: string, user: User) {
  const visit = await prisma.landVisitRequest.findUnique({ where: { id }, include: VISIT_INCLUDE_DETAIL });
  if (!visit) throw ApiError.notFound('Visit request not found.');
  assertCanView(visit, user);
  return visit;
}

/** Seller (or admin) accepts/rejects/completes a request on their listing. */
export async function updateVisitStatus(id: string, user: User, { status, responseNote }: UpdateVisitStatusInput) {
  const visit = await prisma.landVisitRequest.findUnique({ where: { id }, include: VISIT_INCLUDE_DETAIL });
  if (!visit) throw ApiError.notFound('Visit request not found.');

  const isOwner = visit.land.sellerId === user.id;
  const isBuyer = visit.buyerId === user.id;
  if (user.role !== 'ADMIN' && !isOwner && !isBuyer) {
    throw ApiError.forbidden('You do not have permission to update this visit request.');
  }
  // Only the seller (or admin) can accept/reject/complete; the buyer's only
  // allowed transition is cancelling their own request.
  if (status !== 'CANCELLED' && !isOwner && user.role !== 'ADMIN') {
    throw ApiError.forbidden('Only the listing owner can accept, reject, or complete a visit request.');
  }
  if (status === 'CANCELLED' && !isBuyer && user.role !== 'ADMIN') {
    throw ApiError.forbidden('Only the requesting buyer can cancel a visit request.');
  }
  if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(visit.status)) {
    throw ApiError.badRequest(`This visit request is already ${visit.status.toLowerCase()} and cannot be changed further.`);
  }

  return prisma.landVisitRequest.update({
    where: { id },
    data: { status, responseNote },
    include: VISIT_INCLUDE_DETAIL,
  });
}
