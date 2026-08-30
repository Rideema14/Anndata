"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSeedCategories = listSeedCategories;
exports.getSeedCategoryBySlug = getSeedCategoryBySlug;
exports.createSeedCategory = createSeedCategory;
exports.updateSeedCategory = updateSeedCategory;
exports.updateSeedCategoryImage = updateSeedCategoryImage;
exports.deleteSeedCategory = deleteSeedCategory;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const slugify_1 = require("../../common/utils/slugify");
const cloudinary_1 = require("../../config/cloudinary");
async function listSeedCategories({ includeInactive = false } = {}) {
    return prisma_1.default.seedCategory.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' },
    });
}
async function getSeedCategoryBySlug(slug) {
    const category = await prisma_1.default.seedCategory.findUnique({ where: { slug } });
    if (!category)
        throw ApiError_1.default.notFound('Seed category not found.');
    return category;
}
async function createSeedCategory(data) {
    const slug = (0, slugify_1.slugify)(data.name);
    const clash = await prisma_1.default.seedCategory.findUnique({ where: { slug } });
    return prisma_1.default.seedCategory.create({ data: { ...data, slug: clash ? (0, slugify_1.slugifyUnique)(data.name) : slug } });
}
async function updateSeedCategory(id, data) {
    const category = await prisma_1.default.seedCategory.findUnique({ where: { id } });
    if (!category)
        throw ApiError_1.default.notFound('Seed category not found.');
    const updateData = { ...data };
    if (data.name && data.name !== category.name) {
        const slug = (0, slugify_1.slugify)(data.name);
        const clash = await prisma_1.default.seedCategory.findFirst({ where: { slug, NOT: { id } } });
        updateData.slug = clash ? (0, slugify_1.slugifyUnique)(data.name) : slug;
    }
    return prisma_1.default.seedCategory.update({ where: { id }, data: updateData });
}
async function updateSeedCategoryImage(id, fileBuffer) {
    const category = await prisma_1.default.seedCategory.findUnique({ where: { id } });
    if (!category)
        throw ApiError_1.default.notFound('Seed category not found.');
    const { url, publicId } = await (0, cloudinary_1.uploadBuffer)(fileBuffer, { folder: 'agri-marketplace/seed-categories' });
    const updated = await prisma_1.default.seedCategory.update({ where: { id }, data: { imageUrl: url, imagePublicId: publicId } });
    if (category.imagePublicId) {
        await (0, cloudinary_1.deleteAsset)(category.imagePublicId).catch(() => { });
    }
    return updated;
}
async function deleteSeedCategory(id) {
    const category = await prisma_1.default.seedCategory.findUnique({ where: { id }, include: { seeds: { take: 1 } } });
    if (!category)
        throw ApiError_1.default.notFound('Seed category not found.');
    if (category.seeds.length > 0) {
        throw ApiError_1.default.conflict('Cannot delete a seed category that still has seeds. Deactivate it instead.');
    }
    await prisma_1.default.seedCategory.delete({ where: { id } });
    if (category.imagePublicId) {
        await (0, cloudinary_1.deleteAsset)(category.imagePublicId).catch(() => { });
    }
}
//# sourceMappingURL=seedCategory.service.js.map