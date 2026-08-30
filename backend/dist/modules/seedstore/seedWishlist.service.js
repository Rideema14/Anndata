"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSeedWishlist = listSeedWishlist;
exports.addToSeedWishlist = addToSeedWishlist;
exports.removeFromSeedWishlist = removeFromSeedWishlist;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const pagination_1 = require("../../common/utils/pagination");
async function listSeedWishlist(userId, query) {
    const { page, limit, skip, take } = (0, pagination_1.parsePagination)(query);
    const [items, totalItems] = await Promise.all([
        prisma_1.default.seedWishlist.findMany({
            where: { userId },
            include: { seed: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        prisma_1.default.seedWishlist.count({ where: { userId } }),
    ]);
    return { items, meta: (0, pagination_1.buildPaginationMeta)(page, limit, totalItems) };
}
async function addToSeedWishlist(userId, seedId) {
    const seed = await prisma_1.default.seed.findUnique({ where: { id: seedId } });
    if (!seed || !seed.isActive)
        throw ApiError_1.default.notFound('Seed not found.');
    return prisma_1.default.seedWishlist.upsert({
        where: { userId_seedId: { userId, seedId } },
        update: {},
        create: { userId, seedId },
    });
}
async function removeFromSeedWishlist(userId, seedId) {
    await prisma_1.default.seedWishlist.deleteMany({ where: { userId, seedId } });
}
//# sourceMappingURL=seedWishlist.service.js.map