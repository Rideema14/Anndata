"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFavorites = listFavorites;
exports.addFavorite = addFavorite;
exports.removeFavorite = removeFavorite;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
async function listFavorites(userId) {
    return prisma_1.default.favoriteMandi.findMany({
        where: { userId },
        include: { mandi: true },
        orderBy: { createdAt: 'desc' },
    });
}
async function addFavorite(userId, mandiId) {
    const mandi = await prisma_1.default.mandi.findUnique({ where: { id: mandiId } });
    if (!mandi || !mandi.isActive)
        throw ApiError_1.default.notFound('Mandi not found.');
    return prisma_1.default.favoriteMandi.upsert({
        where: { userId_mandiId: { userId, mandiId } },
        update: {},
        create: { userId, mandiId },
    });
}
async function removeFavorite(userId, mandiId) {
    await prisma_1.default.favoriteMandi.deleteMany({ where: { userId, mandiId } });
}
//# sourceMappingURL=favorite.service.js.map