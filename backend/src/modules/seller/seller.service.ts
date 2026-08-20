import type { Prisma, User } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { notifyUser } from '../notification/notification.service';
import type {
  ApplyInput,
  UpdateSellerProfileInput,
  ReviewApplicationInput,
  ListApplicationsQuery,
  AnalyticsQuery,
  SellerReviewsQuery,
} from './seller.validation';

export async function getMyProfile(userId: string) {
  const profile = await prisma.sellerProfile.findUnique({ where: { userId } });
  if (!profile) throw ApiError.notFound('You have not applied to become a seller yet.');
  return profile;
}

/** Create the initial application, or re-submit after a rejection. */
export async function applyAsSeller(userId: string, data: ApplyInput) {
  const existing = await prisma.sellerProfile.findUnique({ where: { userId } });

  if (existing && ['PENDING', 'APPROVED'].includes(existing.verificationStatus)) {
    throw ApiError.conflict(
      existing.verificationStatus === 'APPROVED'
        ? 'You are already a verified seller.'
        : 'Your seller application is already pending review.'
    );
  }

  const profile = existing
    ? await prisma.sellerProfile.update({
        where: { userId },
        data: { ...data, verificationStatus: 'PENDING', reviewedById: null, reviewedAt: null, verificationNote: null },
      })
    : await prisma.sellerProfile.create({ data: { ...data, userId, verificationStatus: 'PENDING' } });

  return profile;
}

export async function updateMyProfile(userId: string, data: UpdateSellerProfileInput) {
  const existing = await getMyProfile(userId);

  // Editing business/bank details after a rejection re-queues the application.
  const statusUpdate: { verificationStatus?: 'PENDING' } = existing.verificationStatus === 'REJECTED' ? { verificationStatus: 'PENDING' } : {};

  return prisma.sellerProfile.update({ where: { userId }, data: { ...data, ...statusUpdate } });
}

export async function listApplications(query: ListApplicationsQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.SellerProfileWhereInput = query.status ? { verificationStatus: query.status } : {};

  const [items, totalItems] = await Promise.all([
    prisma.sellerProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    }),
    prisma.sellerProfile.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function reviewApplication(profileId: string, admin: User, { decision, note }: ReviewApplicationInput) {
  const profile = await prisma.sellerProfile.findUnique({ where: { id: profileId } });
  if (!profile) throw ApiError.notFound('Seller application not found.');
  if (profile.verificationStatus !== 'PENDING') {
    throw ApiError.badRequest(`Application is already ${profile.verificationStatus.toLowerCase()}.`);
  }

  const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.sellerProfile.update({
      where: { id: profileId },
      data: {
        verificationStatus: newStatus,
        verificationNote: note,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
    if (newStatus === 'APPROVED') {
      await tx.user.update({ where: { id: profile.userId }, data: { role: 'SELLER' } });
    }
    return result;
  });

  await notifyUser({
    userId: profile.userId,
    type: 'SELLER_VERIFICATION',
    title: newStatus === 'APPROVED' ? 'Your seller application was approved' : 'Your seller application was rejected',
    message:
      newStatus === 'APPROVED'
        ? 'Congratulations — you can now list products on the marketplace.'
        : note || 'Please review your details and re-apply.',
    relatedEntityType: 'SELLER_PROFILE',
    relatedEntityId: profile.id,
    email: {
      subject: newStatus === 'APPROVED' ? 'Seller application approved' : 'Seller application update',
      html: `<p>${
        newStatus === 'APPROVED'
          ? 'Congratulations — your seller application has been approved. You can now list products.'
          : `Your seller application was not approved.${note ? ` Reason: ${note}` : ''}`
      }</p>`,
    },
  });

  return updated;
}

interface CountRow {
  count: number;
}
interface RevenueRow {
  revenue: number;
}

export async function getDashboard(userId: string) {
  const [activeListings, totalListings, toFulfillRows, revenueRows, revenue30dRows] = await Promise.all([
    prisma.product.count({ where: { sellerId: userId, isActive: true } }),
    prisma.product.count({ where: { sellerId: userId } }),
    prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT o.id)::int AS count
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId} AND o.status IN ('CONFIRMED', 'PROCESSING')
    `,
    prisma.$queryRaw<RevenueRow[]>`
      SELECT COALESCE(SUM(oi."totalPrice"), 0)::float AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId} AND o.status != 'CANCELLED'
    `,
    prisma.$queryRaw<RevenueRow[]>`
      SELECT COALESCE(SUM(oi."totalPrice"), 0)::float AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId} AND o.status != 'CANCELLED' AND o."createdAt" >= NOW() - INTERVAL '30 days'
    `,
  ]);

  return {
    activeListings,
    totalListings,
    ordersToFulfill: toFulfillRows[0]?.count ?? 0,
    totalRevenue: revenueRows[0]?.revenue ?? 0,
    revenueLast30Days: revenue30dRows[0]?.revenue ?? 0,
  };
}

interface SalesTrendRow {
  date: Date;
  revenue: number;
  orderCount: number;
}
interface TopProductRow {
  id: string;
  name: string;
  slug: string;
  unitsSold: number;
  revenue: number;
}
interface StatusBreakdownRow {
  status: string;
  count: number;
}

export async function getAnalytics(userId: string, { days, topProductsLimit }: AnalyticsQuery) {
  const [salesTrend, topProducts, statusBreakdown] = await Promise.all([
    prisma.$queryRaw<SalesTrendRow[]>`
      SELECT
        DATE_TRUNC('day', o."createdAt")::date AS date,
        COALESCE(SUM(oi."totalPrice"), 0)::float AS revenue,
        COUNT(DISTINCT o.id)::int AS "orderCount"
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId}
        AND o.status != 'CANCELLED'
        AND o."createdAt" >= NOW() - (${days}::text || ' days')::interval
      GROUP BY DATE_TRUNC('day', o."createdAt")
      ORDER BY date ASC
    `,
    prisma.$queryRaw<TopProductRow[]>`
      SELECT p.id, p.name, p.slug,
        SUM(oi.quantity)::int AS "unitsSold",
        SUM(oi."totalPrice")::float AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId} AND o.status != 'CANCELLED'
      GROUP BY p.id, p.name, p.slug
      ORDER BY revenue DESC
      LIMIT ${topProductsLimit}
    `,
    prisma.$queryRaw<StatusBreakdownRow[]>`
      SELECT o.status, COUNT(DISTINCT o.id)::int AS count
      FROM order_items oi
      JOIN orders o ON o.id = oi."orderId"
      JOIN products p ON p.id = oi."productId"
      WHERE p."sellerId" = ${userId}
      GROUP BY o.status
    `,
  ]);

  return { salesTrend, topProducts, statusBreakdown };
}

/**
 * A seller's "feedback inbox": every review left on any of their products,
 * newest first, with the reviewer's identity (name + profile picture) and
 * which product it was for — not just the public per-product review list.
 * Deliberately not filtered to isApproved-only reviews — this is the
 * seller's own view of everything said about their products, not the
 * public-facing product page.
 */
export async function getReviews(sellerId: string, query: SellerReviewsQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.ReviewWhereInput = { product: { sellerId } };
  if (query.productId) where.productId = query.productId;
  if (query.minRating) where.rating = { gte: query.minRating };

  const [items, totalItems] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
        product: { select: { id: true, name: true, slug: true, images: { orderBy: { sortOrder: 'asc' }, take: 1 } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}
