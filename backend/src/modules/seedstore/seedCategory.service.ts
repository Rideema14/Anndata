import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { slugify, slugifyUnique } from '../../common/utils/slugify';
import { uploadBuffer, deleteAsset } from '../../config/cloudinary';
import type { SeedCategoryInput } from './seed.validation';

export async function listSeedCategories({ includeInactive = false }: { includeInactive?: boolean } = {}) {
  return prisma.seedCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getSeedCategoryBySlug(slug: string) {
  const category = await prisma.seedCategory.findUnique({ where: { slug } });
  if (!category) throw ApiError.notFound('Seed category not found.');
  return category;
}

export async function createSeedCategory(data: SeedCategoryInput) {
  const slug = slugify(data.name);
  const clash = await prisma.seedCategory.findUnique({ where: { slug } });
  return prisma.seedCategory.create({ data: { ...data, slug: clash ? slugifyUnique(data.name) : slug } });
}

export async function updateSeedCategory(id: string, data: Partial<SeedCategoryInput>) {
  const category = await prisma.seedCategory.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Seed category not found.');

  const updateData: Partial<SeedCategoryInput> & { slug?: string } = { ...data };
  if (data.name && data.name !== category.name) {
    const slug = slugify(data.name);
    const clash = await prisma.seedCategory.findFirst({ where: { slug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(data.name) : slug;
  }

  return prisma.seedCategory.update({ where: { id }, data: updateData });
}

export async function updateSeedCategoryImage(id: string, fileBuffer: Buffer) {
  const category = await prisma.seedCategory.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Seed category not found.');

  const { url, publicId } = await uploadBuffer(fileBuffer, { folder: 'agri-marketplace/seed-categories' });
  const updated = await prisma.seedCategory.update({ where: { id }, data: { imageUrl: url, imagePublicId: publicId } });

  if (category.imagePublicId) {
    await deleteAsset(category.imagePublicId).catch(() => {});
  }

  return updated;
}

export async function deleteSeedCategory(id: string) {
  const category = await prisma.seedCategory.findUnique({ where: { id }, include: { seeds: { take: 1 } } });
  if (!category) throw ApiError.notFound('Seed category not found.');
  if (category.seeds.length > 0) {
    throw ApiError.conflict('Cannot delete a seed category that still has seeds. Deactivate it instead.');
  }
  await prisma.seedCategory.delete({ where: { id } });
  if (category.imagePublicId) {
    await deleteAsset(category.imagePublicId).catch(() => {});
  }
}
