import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { ListUsersQuery, PlatformAnalyticsQuery, AdminReviewsQuery, AdminProductsQuery } from './admin.validation';

// --- User management ---------------------------------------------------

export async function listUsers(query: ListUsersQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.UserWhereInput = {};
  if (query.role) where.role = query.role;
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        authProvider: true,
        isEmailVerified: true,
        isActive: true,
        profileImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function updateUserStatus(adminId: string, targetUserId: string, isActive: boolean) {
  if (adminId === targetUserId) {
    throw ApiError.badRequest('You cannot change your own account status.');
  }
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw ApiError.notFound('User not found.');

  const updated = await prisma.user.update({ where: { id: targetUserId }, data: { isActive } });

  if (!isActive) {
    // Deactivation should end every active session immediately, not just block new logins.
    await prisma.refreshToken.updateMany({ where: { userId: targetUserId, revoked: false }, data: { revoked: true } });
  }

  return updated;
}

export async function updateUserRole(adminId: string, targetUserId: string, role: 'BUYER' | 'SELLER' | 'ADMIN') {
  if (adminId === targetUserId) {
    throw ApiError.badRequest('You cannot change your own role.');
  }
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw ApiError.notFound('User not found.');

  // A blunt, support-facing override — separate from the formal /sellers/apply +
  // /sellers/applications/:id/review workflow. Setting role=SELLER this way does
  // NOT create a SellerProfile; the user still won't have one until they apply
  // normally, so prefer the application flow for granting seller access.
  return prisma.user.update({ where: { id: targetUserId }, data: { role } });
}

// --- Platform analytics --------------------------------------------------

interface MonthlyGmvRow {
  month: Date;
  gmv: number;
  orderCount: number;
}

export async function getPlatformAnalytics({ months }: PlatformAnalyticsQuery) {
  const [usersByRole, totalOrders, totalProducts, gmvRows, statusBreakdown, monthlyGmv] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { role: true } }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.$queryRaw<{ gmv: number }[]>`
      SELECT COALESCE(SUM("totalAmount"), 0)::float AS gmv FROM orders WHERE status != 'CANCELLED'
    `,
    prisma.order.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.$queryRaw<MonthlyGmvRow[]>`
      SELECT
        DATE_TRUNC('month', "createdAt")::date AS month,
        COALESCE(SUM("totalAmount"), 0)::float AS gmv,
        COUNT(*)::int AS "orderCount"
      FROM orders
      WHERE status != 'CANCELLED' AND "createdAt" >= NOW() - (${months}::text || ' months')::interval
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC
    `,
  ]);

  const roleCounts = Object.fromEntries(usersByRole.map((r) => [r.role, r._count.role]));

  return {
    totalUsers: usersByRole.reduce((sum, r) => sum + r._count.role, 0),
    totalBuyers: roleCounts.BUYER ?? 0,
    totalSellers: roleCounts.SELLER ?? 0,
    totalAdmins: roleCounts.ADMIN ?? 0,
    totalOrders,
    totalProducts,
    gmv: gmvRows[0]?.gmv ?? 0,
    monthlyGmv,
    orderStatusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count.status })),
  };
}

// --- Cross-product review moderation queue ----------------------------

export async function listAllReviews(query: AdminReviewsQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.ReviewWhereInput = {};
  if (query.isApproved !== undefined) where.isApproved = query.isApproved;
  if (query.minRating) where.rating = { gte: query.minRating };
  if (query.productId) where.productId = query.productId;

  const [items, totalItems] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, profileImage: true } },
        product: { select: { id: true, name: true, slug: true, sellerId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.review.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

// --- Product oversight (sees inactive listings too, unlike the public endpoint) ---

export async function listAllProducts(query: AdminProductsQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.ProductWhereInput = {};
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { brand: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}
