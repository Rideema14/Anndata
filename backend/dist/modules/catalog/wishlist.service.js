"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listWishlist = listWishlist;
exports.addToWishlist = addToWishlist;
exports.removeFromWishlist = removeFromWishlist;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
async function listWishlist(userId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const [items, totalItems] = await Promise.all([
        prisma_1.default.wishlist.findMany({
            where: { userId },
            include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.wishlist.count({ where: { userId } }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function addToWishlist(userId, productId) {
    const product = await prisma_1.default.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive)
        throw ApiError_1.default.notFound('Product not found.');
    return prisma_1.default.wishlist.upsert({
        where: { userId_productId: { userId, productId } },
        update: {},
        create: { userId, productId },
    });
}
async function removeFromWishlist(userId, productId) {
    await prisma_1.default.wishlist.deleteMany({ where: { userId, productId } });
}
//# sourceMappingURL=wishlist.service.js.map