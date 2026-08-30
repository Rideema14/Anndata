"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMachineryCategories = listMachineryCategories;
exports.getMachineryCategoryBySlug = getMachineryCategoryBySlug;
exports.createMachineryCategory = createMachineryCategory;
exports.updateMachineryCategory = updateMachineryCategory;
exports.updateMachineryCategoryImage = updateMachineryCategoryImage;
exports.deleteMachineryCategory = deleteMachineryCategory;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const slugify_1 = require("../../common/utils/slugify");
const cloudinary_1 = require("../../config/cloudinary");
async function listMachineryCategories({ includeInactive = false } = {}) {
    return prisma_1.default.machineryCategory.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: { name: 'asc' },
    });
}
async function getMachineryCategoryBySlug(slug) {
    const category = await prisma_1.default.machineryCategory.findUnique({ where: { slug } });
    if (!category)
        throw ApiError_1.default.notFound('Machinery category not found.');
    return category;
}
async function createMachineryCategory(data) {
    const slug = (0, slugify_1.slugify)(data.name);
    const clash = await prisma_1.default.machineryCategory.findUnique({ where: { slug } });
    return prisma_1.default.machineryCategory.create({ data: { ...data, slug: clash ? (0, slugify_1.slugifyUnique)(data.name) : slug } });
}
async function updateMachineryCategory(id, data) {
    const category = await prisma_1.default.machineryCategory.findUnique({ where: { id } });
    if (!category)
        throw ApiError_1.default.notFound('Machinery category not found.');
    const updateData = { ...data };
    if (data.name && data.name !== category.name) {
        const slug = (0, slugify_1.slugify)(data.name);
        const clash = await prisma_1.default.machineryCategory.findFirst({ where: { slug, NOT: { id } } });
        updateData.slug = clash ? (0, slugify_1.slugifyUnique)(data.name) : slug;
    }
    return prisma_1.default.machineryCategory.update({ where: { id }, data: updateData });
}
async function updateMachineryCategoryImage(id, fileBuffer) {
    const category = await prisma_1.default.machineryCategory.findUnique({ where: { id } });
    if (!category)
        throw ApiError_1.default.notFound('Machinery category not found.');
    const { url, publicId } = await (0, cloudinary_1.uploadBuffer)(fileBuffer, { folder: 'agri-marketplace/machinery-categories' });
    const updated = await prisma_1.default.machineryCategory.update({ where: { id }, data: { imageUrl: url, imagePublicId: publicId } });
    if (category.imagePublicId) {
        await (0, cloudinary_1.deleteAsset)(category.imagePublicId).catch(() => { });
    }
    return updated;
}
async function deleteMachineryCategory(id) {
    const category = await prisma_1.default.machineryCategory.findUnique({ where: { id }, include: { machinery: { take: 1 } } });
    if (!category)
        throw ApiError_1.default.notFound('Machinery category not found.');
    if (category.machinery.length > 0) {
        throw ApiError_1.default.conflict('Cannot delete a category that still has machinery listings. Deactivate it instead.');
    }
    await prisma_1.default.machineryCategory.delete({ where: { id } });
    if (category.imagePublicId) {
        await (0, cloudinary_1.deleteAsset)(category.imagePublicId).catch(() => { });
    }
}
//# sourceMappingURL=machineryCategory.service.js.map