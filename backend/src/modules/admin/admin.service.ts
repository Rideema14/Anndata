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

// --- Seller payouts ------------------------------------------------------
// Balance = revenue from that seller's items across DELIVERED orders, minus
// their non-reversed payouts. Computed on the fly (not stored) so it's
// never stale, batched across all fetched sellers to avoid N+1 queries.

interface SellerEarnedRow {
  sellerId: string;
  earned: number;
}

async function earnedAndPaidOutBySeller(sellerIds: string[]): Promise<Map<string, { earned: number; paidOut: number }>> {
  const result = new Map<string, { earned: number; paidOut: number }>();
  if (sellerIds.length === 0) return result;

  const [earnedRows, paidOutRows] = await Promise.all([
    prisma.$queryRaw<SellerEarnedRow[]>`
      SELECT p."sellerId" AS "sellerId", COALESCE(SUM(oi."totalPrice"), 0)::float AS earned
      FROM order_items oi
      JOIN products p ON p.id = oi."productId"
      JOIN orders o ON o.id = oi."orderId"
      WHERE o.status = 'DELIVERED' AND p."sellerId" = ANY(${sellerIds})
      GROUP BY p."sellerId"
    `,
    prisma.payout.groupBy({ by: ['sellerId'], where: { sellerId: { in: sellerIds }, status: 'PAID' }, _sum: { amount: true } }),
  ]);

  for (const id of sellerIds) result.set(id, { earned: 0, paidOut: 0 });
  for (const row of earnedRows) result.set(row.sellerId, { ...(result.get(row.sellerId) ?? { earned: 0, paidOut: 0 }), earned: row.earned });
  for (const row of paidOutRows) {
    const current = result.get(row.sellerId) ?? { earned: 0, paidOut: 0 };
    result.set(row.sellerId, { ...current, paidOut: Number(row._sum.amount ?? 0) });
  }
  return result;
}

const SELLER_BALANCE_SELECT = {
  id: true,
  name: true,
  email: true,
  sellerProfile: {
    select: { businessName: true, bankAccountHolder: true, bankAccountNumber: true, bankIfscCode: true, bankName: true },
  },
} satisfies Prisma.UserSelect;

function shapeSellerBalance(
  user: Prisma.UserGetPayload<{ select: typeof SELLER_BALANCE_SELECT }>,
  totals: { earned: number; paidOut: number }
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    businessName: user.sellerProfile?.businessName ?? null,
    bankAccountHolder: user.sellerProfile?.bankAccountHolder ?? null,
    bankAccountNumber: user.sellerProfile?.bankAccountNumber ?? null,
    bankIfscCode: user.sellerProfile?.bankIfscCode ?? null,
    bankName: user.sellerProfile?.bankName ?? null,
    totalEarned: totals.earned,
    totalPaidOut: totals.paidOut,
    balance: totals.earned - totals.paidOut,
  };
}

export async function getSellerBalances(query: { page?: string; limit?: string; search?: string }) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.UserWhereInput = { role: 'SELLER' };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
      { sellerProfile: { businessName: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  const [users, totalItems] = await Promise.all([
    prisma.user.findMany({ where, select: SELLER_BALANCE_SELECT, orderBy: { name: 'asc' }, skip, take }),
    prisma.user.count({ where }),
  ]);

  const totals = await earnedAndPaidOutBySeller(users.map((u) => u.id));
  const items = users.map((u) => shapeSellerBalance(u, totals.get(u.id) ?? { earned: 0, paidOut: 0 }));

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getSellerBalance(sellerId: string) {
  const user = await prisma.user.findFirst({ where: { id: sellerId, role: 'SELLER' }, select: SELLER_BALANCE_SELECT });
  if (!user) throw ApiError.notFound('Seller not found.');
  const totals = await earnedAndPaidOutBySeller([sellerId]);
  return shapeSellerBalance(user, totals.get(sellerId) ?? { earned: 0, paidOut: 0 });
}

export async function listPayouts(query: { page?: string; limit?: string }) {
  const { page, limit, skip, take } = parsePagination(query);

  const [items, totalItems] = await Promise.all([
    prisma.payout.findMany({
      include: { seller: { select: { id: true, name: true, email: true, sellerProfile: { select: { businessName: true } } } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.payout.count(),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function createPayout(
  adminId: string,
  sellerId: string,
  { amount, method, reference, note }: { amount: number; method: 'BANK_TRANSFER' | 'UPI' | 'OTHER'; reference?: string; note?: string }
) {
  const seller = await prisma.user.findFirst({ where: { id: sellerId, role: 'SELLER' } });
  if (!seller) throw ApiError.notFound('Seller not found.');
  if (amount <= 0) throw ApiError.badRequest('Amount must be greater than 0.');

  const balance = await getSellerBalance(sellerId);
  if (amount > balance.balance) {
    throw ApiError.badRequest(`Amount exceeds this seller's outstanding balance of ${balance.balance}.`);
  }

  return prisma.payout.create({
    data: { sellerId, amount, method, reference, note, paidById: adminId },
    include: { seller: { select: { id: true, name: true, email: true, sellerProfile: { select: { businessName: true } } } } },
  });
}

export async function reversePayout(payoutId: string) {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw ApiError.notFound('Payout not found.');
  if (payout.status === 'REVERSED') throw ApiError.badRequest('This payout has already been reversed.');

  return prisma.payout.update({
    where: { id: payoutId },
    data: { status: 'REVERSED' },
    include: { seller: { select: { id: true, name: true, email: true, sellerProfile: { select: { businessName: true } } } } },
  });
}

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
