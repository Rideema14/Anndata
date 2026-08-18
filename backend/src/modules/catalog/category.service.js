const prisma = require('../../config/prisma');
const ApiError = require('../../common/utils/ApiError');
const { slugify, slugifyUnique } = require('../../common/utils/slugify');
const { uploadBuffer } = require('../../config/cloudinary');

async function listCategories({ includeInactive = false } = {}) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: { subCategories: includeInactive ? true : { where: { isActive: true } } },
    orderBy: { name: 'asc' },
  });
}

async function getCategoryBySlug(slug) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { subCategories: { where: { isActive: true } } },
  });
  if (!category) throw ApiError.notFound('Category not found.');
  return category;
}

async function createCategory(data) {
  const slug = slugify(data.name);
  const clash = await prisma.category.findUnique({ where: { slug } });
  return prisma.category.create({ data: { ...data, slug: clash ? slugifyUnique(data.name) : slug } });
}

async function updateCategory(id, data) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Category not found.');

  const updateData = { ...data };
  if (data.name && data.name !== category.name) {
    const slug = slugify(data.name);
    const clash = await prisma.category.findFirst({ where: { slug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(data.name) : slug;
  }

  return prisma.category.update({ where: { id }, data: updateData });
}

async function updateCategoryImage(id, fileBuffer) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Category not found.');

  const { url } = await uploadBuffer(fileBuffer, { folder: 'agri-marketplace/categories' });
  return prisma.category.update({ where: { id }, data: { imageUrl: url } });
}

async function deleteCategory(id) {
  const category = await prisma.category.findUnique({ where: { id }, include: { products: { take: 1 } } });
  if (!category) throw ApiError.notFound('Category not found.');
  if (category.products.length > 0) {
    throw ApiError.conflict('Cannot delete a category that still has products. Deactivate it instead.');
  }
  await prisma.category.delete({ where: { id } });
}

async function createSubCategory(data) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw ApiError.badRequest('Parent category does not exist.');

  const slug = slugify(data.name);
  const clash = await prisma.subCategory.findUnique({ where: { slug } });
  return prisma.subCategory.create({ data: { ...data, slug: clash ? slugifyUnique(data.name) : slug } });
}

async function updateSubCategory(id, data) {
  const subCategory = await prisma.subCategory.findUnique({ where: { id } });
  if (!subCategory) throw ApiError.notFound('Sub-category not found.');

  const updateData = { ...data };
  if (data.name && data.name !== subCategory.name) {
    const slug = slugify(data.name);
    const clash = await prisma.subCategory.findFirst({ where: { slug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(data.name) : slug;
  }

  return prisma.subCategory.update({ where: { id }, data: updateData });
}

async function deleteSubCategory(id) {
  const subCategory = await prisma.subCategory.findUnique({ where: { id }, include: { products: { take: 1 } } });
  if (!subCategory) throw ApiError.notFound('Sub-category not found.');
  if (subCategory.products.length > 0) {
    throw ApiError.conflict('Cannot delete a sub-category that still has products. Deactivate it instead.');
  }
  await prisma.subCategory.delete({ where: { id } });
}

module.exports = {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  updateCategoryImage,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
};
