import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { slugify, slugifyUnique } from '../../common/utils/slugify';
import { uploadBuffer, deleteAsset } from '../../config/cloudinary';
import type { MachineryCategoryInput } from './machinery.validation';

export async function listMachineryCategories({ includeInactive = false }: { includeInactive?: boolean } = {}) {
  return prisma.machineryCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getMachineryCategoryBySlug(slug: string) {
  const category = await prisma.machineryCategory.findUnique({ where: { slug } });
  if (!category) throw ApiError.notFound('Machinery category not found.');
  return category;
}

export async function createMachineryCategory(data: MachineryCategoryInput) {
  const slug = slugify(data.name);
  const clash = await prisma.machineryCategory.findUnique({ where: { slug } });
  return prisma.machineryCategory.create({ data: { ...data, slug: clash ? slugifyUnique(data.name) : slug } });
}

export async function updateMachineryCategory(id: string, data: Partial<MachineryCategoryInput>) {
  const category = await prisma.machineryCategory.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Machinery category not found.');

  const updateData: Partial<MachineryCategoryInput> & { slug?: string } = { ...data };
  if (data.name && data.name !== category.name) {
    const slug = slugify(data.name);
    const clash = await prisma.machineryCategory.findFirst({ where: { slug, NOT: { id } } });
    updateData.slug = clash ? slugifyUnique(data.name) : slug;
  }

  return prisma.machineryCategory.update({ where: { id }, data: updateData });
}

export async function updateMachineryCategoryImage(id: string, fileBuffer: Buffer) {
  const category = await prisma.machineryCategory.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Machinery category not found.');

  const { url, publicId } = await uploadBuffer(fileBuffer, { folder: 'agri-marketplace/machinery-categories' });
  const updated = await prisma.machineryCategory.update({ where: { id }, data: { imageUrl: url, imagePublicId: publicId } });

  if (category.imagePublicId) {
    await deleteAsset(category.imagePublicId).catch(() => {});
  }

  return updated;
}

export async function deleteMachineryCategory(id: string) {
  const category = await prisma.machineryCategory.findUnique({ where: { id }, include: { machinery: { take: 1 } } });
  if (!category) throw ApiError.notFound('Machinery category not found.');
  if (category.machinery.length > 0) {
    throw ApiError.conflict('Cannot delete a category that still has machinery listings. Deactivate it instead.');
  }
  await prisma.machineryCategory.delete({ where: { id } });
  if (category.imagePublicId) {
    await deleteAsset(category.imagePublicId).catch(() => {});
  }
}
