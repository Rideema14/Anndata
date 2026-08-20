/**
 * Optional sync from data.gov.in's "Variety-wise Daily Market Prices of
 * Commodity" (Agmarknet) dataset. This is a REAL government dataset, but
 * using it requires YOUR OWN free API key from https://data.gov.in (My
 * Account -> API Access) and the current resource ID from that dataset's
 * page — both change over time and neither is something to hardcode here.
 *
 * Until DATA_GOV_IN_API_KEY and DATA_GOV_IN_RESOURCE_ID are both set, this
 * module simply no-ops: mandi prices are entered by admins via the regular
 * CRUD/bulk-upload endpoints instead, which always works with zero setup.
 *
 * The field mapping below (state/district/market/commodity/variety/
 * arrival_date/min_price/max_price/modal_price) matches this dataset's
 * consistently-documented shape, but verify it against a live response
 * before relying on it — open government data APIs occasionally change
 * field names without notice, and this hasn't been tested against a real
 * key in this environment.
 */
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import ApiError from '../../common/utils/ApiError';
import logger from '../../common/utils/logger';
import { bulkUpsertPriceEntries } from './price.service';
import type { PriceEntryInput } from './mandi.validation';

interface DataGovInRecord {
  State?: string;
  District?: string;
  Market?: string;
  Commodity?: string;
  Variety?: string;
  Arrival_Date?: string; // DD/MM/YYYY
  Min_Price?: string;
  Max_Price?: string;
  Modal_Price?: string;
}

interface DataGovInResponse {
  total?: number;
  count?: number;
  records?: DataGovInRecord[];
}

export function isIngestionConfigured(): boolean {
  return Boolean(env.dataGovIn.apiKey && env.dataGovIn.resourceId);
}

/** Parses the DD/MM/YYYY format this dataset uses — NOT safe to hand to `new Date()` directly. */
function parseIndianDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
  return Number.isNaN(date.getTime()) ? null : date;
}

async function findOrCreateMandi(name: string, state: string, district: string): Promise<string> {
  const existing = await prisma.mandi.findUnique({ where: { name_state_district: { name, state, district } } });
  if (existing) return existing.id;
  const created = await prisma.mandi.create({ data: { name, state, district } });
  return created.id;
}

async function findOrCreateCrop(name: string): Promise<string> {
  const existing = await prisma.crop.findUnique({ where: { name } });
  if (existing) return existing.id;
  const created = await prisma.crop.create({ data: { name } });
  return created.id;
}

async function fetchPage(offset: number, limit: number): Promise<DataGovInResponse> {
  const params = new URLSearchParams({
    'api-key': env.dataGovIn.apiKey as string,
    format: 'json',
    limit: String(limit),
    offset: String(offset),
  });
  const url = `${env.dataGovIn.baseUrl}/${env.dataGovIn.resourceId}?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw ApiError.internal(`data.gov.in request failed (${response.status}): ${body.slice(0, 300)}`);
  }
  return (await response.json()) as DataGovInResponse;
}

export interface SyncResult {
  fetched: number;
  imported: number;
  skippedMalformed: number;
  skippedByImport: number;
}

/**
 * Pulls up to `maxRecords` recent records and upserts them as MandiPrice
 * rows, auto-creating any Mandi/Crop that doesn't already exist by name.
 * Malformed records (unparseable date, non-numeric price) are skipped
 * individually rather than failing the whole sync.
 */
export async function syncFromDataGovIn(maxRecords = 500): Promise<SyncResult> {
  if (!isIngestionConfigured()) {
    throw ApiError.badRequest(
      'Mandi price sync is not configured. Set DATA_GOV_IN_API_KEY and DATA_GOV_IN_RESOURCE_ID to enable it.'
    );
  }

  const pageSize = Math.min(maxRecords, 200);
  const page = await fetchPage(0, pageSize);
  const records = page.records || [];

  const entries: PriceEntryInput[] = [];
  let skippedMalformed = 0;

  for (const record of records) {
    const { State: state, District: district, Market: market, Commodity: commodity, Variety: variety, Arrival_Date: arrivalDate, Min_Price: minStr, Max_Price: maxStr, Modal_Price: modalStr } = record;

    if (!state || !district || !market || !commodity || !arrivalDate) {
      skippedMalformed += 1;
      continue;
    }

    const priceDate = parseIndianDate(arrivalDate);
    const minPrice = Number(minStr);
    const maxPrice = Number(maxStr);
    const modalPrice = Number(modalStr);

    if (!priceDate || Number.isNaN(minPrice) || Number.isNaN(maxPrice) || Number.isNaN(modalPrice)) {
      skippedMalformed += 1;
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const mandiId = await findOrCreateMandi(market, state, district);
      // eslint-disable-next-line no-await-in-loop
      const cropId = await findOrCreateCrop(commodity);
      entries.push({ mandiId, cropId, variety: variety || undefined, minPrice, maxPrice, modalPrice, priceDate });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`Skipping data.gov.in record (mandi/crop resolution failed): ${message}`);
      skippedMalformed += 1;
    }
  }

  const importResult = entries.length > 0 ? await bulkUpsertPriceEntries(entries, 'EXTERNAL_API') : { created: 0, skipped: [] };

  return {
    fetched: records.length,
    imported: importResult.created,
    skippedMalformed,
    skippedByImport: importResult.skipped.length,
  };
}
