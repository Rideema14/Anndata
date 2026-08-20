import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { slugify, slugifyUnique } from '../../common/utils/slugify';
import { uploadBuffer } from '../../config/cloudinary';
import type { CategoryInput, SubCategoryInput } from './catalog.validation';

export async function listCategories({ includeInactive = false }: { includeInactive?: boolean } = {}) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: { subCategories: includeInactive ? true : { where: { isActive: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { subCategories: { where: { isActive: true } } },
  });
  if (!category) throw ApiError.notFound('Category not found.');
  return category;
}

export async function createCategory(data: CategoryInput) {
  const slug = slugify(data.name);
  const clash = await prisma.category.findUnique({ where: { slug } });
  return prisma.category.create({ data: { ...data, slug: clash ? slugifyUnique(data.name) : slug } });
}

export async function updateCategory(id: string, data: Partial<CategoryInput>) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Category not found.');

  const updateData: Partial<CategoryInput> & { slug?: string } = { ...data };
  if (data.name && data.name !== category.name) {
    const slug = slugify(data.name);
    const clash = await prisma.category.findFirst({ where: { slug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(data.name) : slug;
  }

  return prisma.category.update({ where: { id }, data: updateData });
}

export async function updateCategoryImage(id: string, fileBuffer: Buffer) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Category not found.');

  const { url } = await uploadBuffer(fileBuffer, { folder: 'agri-marketplace/categories' });
  return prisma.category.update({ where: { id }, data: { imageUrl: url } });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id }, include: { products: { take: 1 } } });
  if (!category) throw ApiError.notFound('Category not found.');
  if (category.products.length > 0) {
    throw ApiError.conflict('Cannot delete a category that still has products. Deactivate it instead.');
  }
  await prisma.category.delete({ where: { id } });
}

export async function createSubCategory(data: SubCategoryInput) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
  if (!category) throw ApiError.badRequest('Parent category does not exist.');

  const slug = slugify(data.name);
  const clash = await prisma.subCategory.findUnique({ where: { slug } });
  return prisma.subCategory.create({ data: { ...data, slug: clash ? slugifyUnique(data.name) : slug } });
}

export async function updateSubCategory(id: string, data: Partial<SubCategoryInput>) {
  const subCategory = await prisma.subCategory.findUnique({ where: { id } });
  if (!subCategory) throw ApiError.notFound('Sub-category not found.');

  const updateData: Partial<SubCategoryInput> & { slug?: string } = { ...data };
  if (data.name && data.name !== subCategory.name) {
    const slug = slugify(data.name);
    const clash = await prisma.subCategory.findFirst({ where: { slug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(data.name) : slug;
  }

  return prisma.subCategory.update({ where: { id }, data: updateData });
}

export async function deleteSubCategory(id: string) {
  const subCategory = await prisma.subCategory.findUnique({ where: { id }, include: { products: { take: 1 } } });
  if (!subCategory) throw ApiError.notFound('Sub-category not found.');
  if (subCategory.products.length > 0) {
    throw ApiError.conflict('Cannot delete a sub-category that still has products. Deactivate it instead.');
  }
  await prisma.subCategory.delete({ where: { id } });
}
