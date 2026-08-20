import type { Prisma, MandiPrice, MandiPriceSource } from '@prisma/client';
import prisma from '../../config/prisma';
import ApiError from '../../common/utils/ApiError';
import { parsePagination, buildPaginationMeta } from '../../common/utils/pagination';
import { checkAlertsForPrice } from './alert.service';
import type { PriceEntryInput, PriceQuery, PriceHistoryQuery } from './mandi.validation';

async function upsertOnePrice(entry: PriceEntryInput, source: MandiPriceSource): Promise<MandiPrice> {
  return prisma.mandiPrice.upsert({
    where: {
      mandiId_cropId_variety_priceDate: {
        mandiId: entry.mandiId,
        cropId: entry.cropId,
        variety: entry.variety ?? null,
        priceDate: entry.priceDate,
      },
    },
    update: { minPrice: entry.minPrice, maxPrice: entry.maxPrice, modalPrice: entry.modalPrice, source },
    create: { ...entry, source },
  });
}

export async function createPriceEntry(data: PriceEntryInput) {
  const [mandi, crop] = await Promise.all([
    prisma.mandi.findUnique({ where: { id: data.mandiId } }),
    prisma.crop.findUnique({ where: { id: data.cropId } }),
  ]);
  if (!mandi) throw ApiError.badRequest('mandiId does not exist.');
  if (!crop) throw ApiError.badRequest('cropId does not exist.');
  if (data.minPrice > data.maxPrice) throw ApiError.badRequest('minPrice cannot be greater than maxPrice.');

  const price = await upsertOnePrice(data, 'ADMIN');
  await checkAlertsForPrice(price);
  return price;
}

export interface BulkImportResult {
  created: number;
  skipped: Array<{ mandiId: string; cropId: string; priceDate: Date; reason: string }>;
}

/** Shared by the admin bulk-upload endpoint and the (optional) external sync job. */
export async function bulkUpsertPriceEntries(entries: PriceEntryInput[], source: MandiPriceSource): Promise<BulkImportResult> {
  const mandiIds = [...new Set(entries.map((e) => e.mandiId))];
  const cropIds = [...new Set(entries.map((e) => e.cropId))];

  const [validMandis, validCrops] = await Promise.all([
    prisma.mandi.findMany({ where: { id: { in: mandiIds } }, select: { id: true } }),
    prisma.crop.findMany({ where: { id: { in: cropIds } }, select: { id: true } }),
  ]);
  const validMandiIds = new Set(validMandis.map((m) => m.id));
  const validCropIds = new Set(validCrops.map((c) => c.id));

  const result: BulkImportResult = { created: 0, skipped: [] };

  for (const entry of entries) {
    if (!validMandiIds.has(entry.mandiId)) {
      result.skipped.push({ mandiId: entry.mandiId, cropId: entry.cropId, priceDate: entry.priceDate, reason: 'mandiId not found' });
      continue;
    }
    if (!validCropIds.has(entry.cropId)) {
      result.skipped.push({ mandiId: entry.mandiId, cropId: entry.cropId, priceDate: entry.priceDate, reason: 'cropId not found' });
      continue;
    }
    if (entry.minPrice > entry.maxPrice) {
      result.skipped.push({ mandiId: entry.mandiId, cropId: entry.cropId, priceDate: entry.priceDate, reason: 'minPrice > maxPrice' });
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const price = await upsertOnePrice(entry, source);
    result.created += 1;
    // eslint-disable-next-line no-await-in-loop
    await checkAlertsForPrice(price);
  }

  return result;
}

export async function listPrices(query: PriceQuery) {
  const { page, limit, skip, take } = parsePagination(query);

  const where: Prisma.MandiPriceWhereInput = {};
  if (query.mandiId) where.mandiId = query.mandiId;
  if (query.cropId) where.cropId = query.cropId;
  if (query.state || query.district) {
    where.mandi = {};
    if (query.state) where.mandi.state = query.state;
    if (query.district) where.mandi.district = query.district;
  }
  if (query.fromDate || query.toDate) {
    where.priceDate = {};
    if (query.fromDate) where.priceDate.gte = query.fromDate;
    if (query.toDate) where.priceDate.lte = query.toDate;
  }

  const [items, totalItems] = await Promise.all([
    prisma.mandiPrice.findMany({
      where,
      include: {
        mandi: { select: { id: true, name: true, state: true, district: true } },
        crop: { select: { id: true, name: true, unit: true } },
      },
      orderBy: { priceDate: 'desc' },
      skip,
      take,
    }),
    prisma.mandiPrice.count({ where }),
  ]);

  return { items, meta: buildPaginationMeta(page, limit, totalItems) };
}

/** Ordered time series for a crop-mandi pair — feeds a line/trend chart on the frontend. */
export async function getPriceHistory({ cropId, mandiId, days }: PriceHistoryQuery) {
  const [crop, mandi] = await Promise.all([
    prisma.crop.findUnique({ where: { id: cropId } }),
    prisma.mandi.findUnique({ where: { id: mandiId } }),
  ]);
  if (!crop) throw ApiError.notFound('Crop not found.');
  if (!mandi) throw ApiError.notFound('Mandi not found.');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const points = await prisma.mandiPrice.findMany({
    where: { cropId, mandiId, priceDate: { gte: cutoff } },
    select: { priceDate: true, minPrice: true, maxPrice: true, modalPrice: true, variety: true },
    orderBy: { priceDate: 'asc' },
  });

  return { crop, mandi, points };
}
