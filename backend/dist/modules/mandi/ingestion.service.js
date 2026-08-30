"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isIngestionConfigured = isIngestionConfigured;
exports.syncFromDataGovIn = syncFromDataGovIn;
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
 * Field mapping (State/District/Market/Commodity/Variety/Arrival_Date/
 * Min_Price/Max_Price/Modal_Price, PascalCase) confirmed against a live
 * response with a real API key — not a guess.
 */
const prisma_1 = __importDefault(require("../../config/prisma"));
const env_1 = require("../../config/env");
const ApiError_1 = __importDefault(require("../../common/utils/ApiError"));
const logger_1 = __importDefault(require("../../common/utils/logger"));
const price_service_1 = require("./price.service");
function isIngestionConfigured() {
    return Boolean(env_1.env.dataGovIn.apiKey && env_1.env.dataGovIn.resourceId);
}
/** Parses the DD/MM/YYYY format this dataset uses — NOT safe to hand to `new Date()` directly. */
function parseIndianDate(value) {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!match)
        return null;
    const [, dd, mm, yyyy] = match;
    const date = new Date(Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd)));
    return Number.isNaN(date.getTime()) ? null : date;
}
async function findOrCreateMandi(name, state, district) {
    const existing = await prisma_1.default.mandi.findUnique({ where: { name_state_district: { name, state, district } } });
    if (existing)
        return existing.id;
    const created = await prisma_1.default.mandi.create({ data: { name, state, district } });
    return created.id;
}
async function findOrCreateCrop(name) {
    const existing = await prisma_1.default.crop.findUnique({ where: { name } });
    if (existing)
        return existing.id;
    const created = await prisma_1.default.crop.create({ data: { name } });
    return created.id;
}
async function fetchPage(offset, limit) {
    const params = new URLSearchParams({
        'api-key': env_1.env.dataGovIn.apiKey,
        format: 'json',
        limit: String(limit),
        offset: String(offset),
    });
    const url = `${env_1.env.dataGovIn.baseUrl}/${env_1.env.dataGovIn.resourceId}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw ApiError_1.default.internal(`data.gov.in request failed (${response.status}): ${body.slice(0, 300)}`);
    }
    return (await response.json());
}
/**
 * Pulls up to `maxRecords` recent records and upserts them as MandiPrice
 * rows, auto-creating any Mandi/Crop that doesn't already exist by name.
 * Malformed records (unparseable date, non-numeric price) are skipped
 * individually rather than failing the whole sync.
 */
async function syncFromDataGovIn(maxRecords = 500) {
    if (!isIngestionConfigured()) {
        throw ApiError_1.default.badRequest('Mandi price sync is not configured. Set DATA_GOV_IN_API_KEY and DATA_GOV_IN_RESOURCE_ID to enable it.');
    }
    const pageSize = Math.min(maxRecords, 200);
    const page = await fetchPage(0, pageSize);
    const records = page.records || [];
    const entries = [];
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger_1.default.warn(`Skipping data.gov.in record (mandi/crop resolution failed): ${message}`);
            skippedMalformed += 1;
        }
    }
    const importResult = entries.length > 0 ? await (0, price_service_1.bulkUpsertPriceEntries)(entries, 'EXTERNAL_API') : { created: 0, skipped: [] };
    return {
        fetched: records.length,
        imported: importResult.created,
        skippedMalformed,
        skippedByImport: importResult.skipped.length,
    };
}
//# sourceMappingURL=ingestion.service.js.map