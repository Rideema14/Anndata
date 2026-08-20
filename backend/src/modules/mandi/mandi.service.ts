import type { Prisma } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import type { MandiInput, CropInput, MandiListQuery } from './mandi.validation';

// --- Cascading location filters ---------------------------------------------

export async function listStates() {
  const rows = await prisma.mandi.findMany({
    where: { isActive: true },
    distinct: ['state'],
    select: { state: true },
    orderBy: { state: 'asc' },
  });
  return rows.map((r) => r.state);
}

export async function listDistricts(state: string) {
  const rows = await prisma.mandi.findMany({
    where: { isActive: true, state },
    distinct: ['district'],
    select: { district: true },
    orderBy: { district: 'asc' },
  });
  return rows.map((r) => r.district);
}

// --- Mandi CRUD --------------------------------------------------------

export async function listMandis(query: MandiListQuery) {
  const { page, limit, skip, take } = parsePagination(query);
  const where: Prisma.MandiWhereInput = { isActive: true };
  if (query.state) where.state = query.state;
  if (query.district) where.district = query.district;

  const [items, totalItems] = await Promise.all([
    prisma.mandi.findMany({ where, orderBy: [{ state: 'asc' }, { district: 'asc' }, { name: 'asc' }], skip, take }),
    prisma.mandi.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

export async function getMandiById(id: string) {
  const mandi = await prisma.mandi.findUnique({ where: { id } });
  if (!mandi) throw ApiError.notFound('Mandi not found.');
  return mandi;
}

export async function createMandi(data: MandiInput) {
  const clash = await prisma.mandi.findUnique({
    where: { name_state_district: { name: data.name, state: data.state, district: data.district } },
  });
  if (clash) throw ApiError.conflict('A mandi with this name already exists in that district.');
  return prisma.mandi.create({ data });
}

export async function updateMandi(id: string, data: Partial<MandiInput>) {
  await getMandiById(id);
  return prisma.mandi.update({ where: { id }, data });
}

export async function deleteMandi(id: string) {
  const mandi = await prisma.mandi.findUnique({ where: { id }, include: { prices: { take: 1 } } });
  if (!mandi) throw ApiError.notFound('Mandi not found.');
  if (mandi.prices.length > 0) {
    throw ApiError.conflict('Cannot delete a mandi that has price records. Deactivate it instead.');
  }
  await prisma.mandi.delete({ where: { id } });
}

// --- Crop CRUD -----------------------------------------------------------

export async function listCrops() {
  return prisma.crop.findMany({ orderBy: { name: 'asc' } });
}

export async function getCropById(id: string) {
  const crop = await prisma.crop.findUnique({ where: { id } });
  if (!crop) throw ApiError.notFound('Crop not found.');
  return crop;
}

export async function createCrop(data: CropInput) {
  const clash = await prisma.crop.findUnique({ where: { name: data.name } });
  if (clash) throw ApiError.conflict('A crop with this name already exists.');
  return prisma.crop.create({ data });
}

export async function updateCrop(id: string, data: Partial<CropInput>) {
  await getCropById(id);
  return prisma.crop.update({ where: { id }, data });
}

export async function deleteCrop(id: string) {
  const crop = await prisma.crop.findUnique({ where: { id }, include: { prices: { take: 1 } } });
  if (!crop) throw ApiError.notFound('Crop not found.');
  if (crop.prices.length > 0) {
    throw ApiError.conflict('Cannot delete a crop that has price records.');
  }
  await prisma.crop.delete({ where: { id } });
}
