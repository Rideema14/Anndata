"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.getCategoryBySlug = getCategoryBySlug;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.updateCategoryImage = updateCategoryImage;
exports.deleteCategory = deleteCategory;
exports.createSubCategory = createSubCategory;
exports.updateSubCategory = updateSubCategory;
exports.deleteSubCategory = deleteSubCategory;
const prisma_1 = __importDefault(require("../../config/prisma"));
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const slugify_1 = require("../../common/utils/slugify");
const cloudinary_1 = require("../../config/cloudinary");
async function listCategories({ includeInactive = false } = {}) {
    return prisma_1.default.category.findMany({
        where: includeInactive ? {} : { isActive: true },
        include: { subCategories: includeInactive ? true : { where: { isActive: true } } },
        orderBy: { name: 'asc' },
    });
}
async function getCategoryBySlug(slug) {
    const category = await prisma_1.default.category.findUnique({
        where: { slug },
        include: { subCategories: { where: { isActive: true } } },
    });
    if (!category)
        throw ApiError_1.default.notFound('Category not found.');
    return category;
}
async function createCategory(data) {
    const slug = (0, slugify_1.slugify)(data.name);
    const clash = await prisma_1.default.category.findUnique({ where: { slug } });
    return prisma_1.default.category.create({ data: { ...data, slug: clash ? (0, slugify_1.slugifyUnique)(data.name) : slug } });
}
async function updateCategory(id, data) {
    const category = await prisma_1.default.category.findUnique({ where: { id } });
    if (!category)
        throw ApiError_1.default.notFound('Category not found.');
    const updateData = { ...data };
    if (data.name && data.name !== category.name) {
        const slug = (0, slugify_1.slugify)(data.name);
        const clash = await prisma_1.default.category.findFirst({ where: { slug, NOT: { id } } });
        updateData.slug = clash ? (0, slugify_1.slugifyUnique)(data.name) : slug;
    }
    return prisma_1.default.category.update({ where: { id }, data: updateData });
}
async function updateCategoryImage(id, fileBuffer) {
    const category = await prisma_1.default.category.findUnique({ where: { id } });
    if (!category)
        throw ApiError_1.default.notFound('Category not found.');
    const { url, publicId } = await (0, cloudinary_1.uploadBuffer)(fileBuffer, { folder: 'agri-marketplace/categories' });
    const updated = await prisma_1.default.category.update({ where: { id }, data: { imageUrl: url, imagePublicId: publicId } });
    if (category.imagePublicId) {
        await (0, cloudinary_1.deleteAsset)(category.imagePublicId).catch(() => { }); // best-effort cleanup of the old asset
    }
    return updated;
}
async function deleteCategory(id) {
    const category = await prisma_1.default.category.findUnique({ where: { id }, include: { products: { take: 1 } } });
    if (!category)
        throw ApiError_1.default.notFound('Category not found.');
    if (category.products.length > 0) {
        throw ApiError_1.default.conflict('Cannot delete a category that still has products. Deactivate it instead.');
    }
    await prisma_1.default.category.delete({ where: { id } });
    if (category.imagePublicId) {
        await (0, cloudinary_1.deleteAsset)(category.imagePublicId).catch(() => { });
    }
}
async function createSubCategory(data) {
    const category = await prisma_1.default.category.findUnique({ where: { id: data.categoryId } });
    if (!category)
        throw ApiError_1.default.badRequest('Parent category does not exist.');
    const slug = (0, slugify_1.slugify)(data.name);
    const clash = await prisma_1.default.subCategory.findUnique({ where: { slug } });
    return prisma_1.default.subCategory.create({ data: { ...data, slug: clash ? (0, slugify_1.slugifyUnique)(data.name) : slug } });
}
async function updateSubCategory(id, data) {
    const subCategory = await prisma_1.default.subCategory.findUnique({ where: { id } });
    if (!subCategory)
        throw ApiError_1.default.notFound('Sub-category not found.');
    const updateData = { ...data };
    if (data.name && data.name !== subCategory.name) {
        const slug = (0, slugify_1.slugify)(data.name);
        const clash = await prisma_1.default.subCategory.findFirst({ where: { slug, NOT: { id } } });
        updateData.slug = clash ? (0, slugify_1.slugifyUnique)(data.name) : slug;
    }
    return prisma_1.default.subCategory.update({ where: { id }, data: updateData });
}
async function deleteSubCategory(id) {
    const subCategory = await prisma_1.default.subCategory.findUnique({ where: { id }, include: { products: { take: 1 } } });
    if (!subCategory)
        throw ApiError_1.default.notFound('Sub-category not found.');
    if (subCategory.products.length > 0) {
        throw ApiError_1.default.conflict('Cannot delete a sub-category that still has products. Deactivate it instead.');
    }
    await prisma_1.default.subCategory.delete({ where: { id } });
}
//# sourceMappingURL=category.service.js.map