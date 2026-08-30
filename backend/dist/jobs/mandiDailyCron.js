"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncYesterdayMandiData = syncYesterdayMandiData;
exports.startMandiDailyCron = startMandiDailyCron;
const node_cron_1 = __importDefault(require("node-cron"));
const logger_1 = __importDefault(require("../common/utils/logger"));
const prisma_1 = __importDefault(require("../config/prisma"));
const API_KEY = process.env.DATA_GOV_IN_API_KEY;
const RESOURCE_ID = process.env.DATA_GOV_IN_RESOURCE_ID;
const BASE_URL = process.env.DATA_GOV_IN_BASE_URL || 'https://api.data.gov.in/resource';
const CHUNK_SIZE = 5000;
const DELAY_MS = 1500;
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Returns yesterday in the format normally used by the AGMARKNET/data.gov.in
 * Arrival_Date field: DD/MM/YYYY.
 */
function getYesterday() {
    // Always calculate the date in IST, regardless of the server/container timezone.
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const year = Number(parts.find((p) => p.type === 'year')?.value);
    const month = Number(parts.find((p) => p.type === 'month')?.value);
    const day = Number(parts.find((p) => p.type === 'day')?.value);
    const yesterday = new Date(Date.UTC(year, month - 1, day - 1));
    return `${String(yesterday.getUTCDate()).padStart(2, '0')}/${String(yesterday.getUTCMonth() + 1).padStart(2, '0')}/${yesterday.getUTCFullYear()}`;
}
function parsePrice(value) {
    if (value === undefined || value === null || String(value).trim() === '') {
        return null;
    }
    const number = typeof value === 'number'
        ? value
        : Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(number) && number >= 0 ? number : null;
}
function parseDate(value) {
    if (!value)
        return null;
    const clean = value.trim();
    // DD/MM/YYYY
    const parts = clean.split('/');
    if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]);
        const year = Number(parts[2]);
        if (Number.isInteger(day) &&
            Number.isInteger(month) &&
            Number.isInteger(year)) {
            return new Date(Date.UTC(year, month - 1, day));
        }
    }
    // YYYY-MM-DD fallback
    const iso = new Date(`${clean}T00:00:00.000Z`);
    return Number.isNaN(iso.getTime()) ? null : iso;
}
function getField(record, ...fields) {
    for (const field of fields) {
        const value = record[field];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            return value;
        }
    }
    return undefined;
}
async function processChunk(records) {
    /*
     * Cache IDs inside the current chunk so the same crop/mandi does not
     * repeatedly hit PostgreSQL.
     */
    const cropCache = new Map();
    const mandiCache = new Map();
    let saved = 0;
    let skipped = 0;
    for (const record of records) {
        const state = record.State?.trim();
        const district = record.District?.trim();
        const market = record.Market?.trim();
        const commodity = record.Commodity?.trim();
        const varietyRaw = getField(record, 'Variety', 'variety');
        const variety = varietyRaw === undefined || varietyRaw === null
            ? null
            : String(varietyRaw).trim() || null;
        const arrivalRaw = getField(record, 'Arrival_Date', 'arrival_date');
        const priceDate = parseDate(arrivalRaw === undefined ? undefined : String(arrivalRaw));
        if (!state ||
            !district ||
            !market ||
            !commodity ||
            !priceDate) {
            skipped++;
            continue;
        }
        const cropKey = commodity.toLowerCase();
        let cropId = cropCache.get(cropKey);
        if (!cropId) {
            const crop = await prisma_1.default.crop.upsert({
                where: {
                    name: commodity,
                },
                update: {},
                create: {
                    name: commodity,
                    unit: 'Quintal',
                },
                select: {
                    id: true,
                },
            });
            cropId = crop.id;
            cropCache.set(cropKey, crop.id);
        }
        const mandiKey = `${market.toLowerCase()}||${state.toLowerCase()}||${district.toLowerCase()}`;
        let mandiId = mandiCache.get(mandiKey);
        if (!mandiId) {
            const mandi = await prisma_1.default.mandi.upsert({
                where: {
                    name_state_district: {
                        name: market,
                        state,
                        district,
                    },
                },
                update: {},
                create: {
                    name: market,
                    state,
                    district,
                },
                select: {
                    id: true,
                },
            });
            mandiId = mandi.id;
            mandiCache.set(mandiKey, mandi.id);
        }
        // Current data.gov.in resource fields are Min_Price / Max_Price / Modal_Price.
        // Keep the x0020/lowercase aliases only as fallbacks for alternate responses.
        const minRaw = getField(record, 'Min_Price', 'Min_x0020_Price', 'min_price');
        const maxRaw = getField(record, 'Max_Price', 'Max_x0020_Price', 'max_price');
        const modalRaw = getField(record, 'Modal_Price', 'Modal_x0020_Price', 'modal_price');
        const minPrice = parsePrice(minRaw);
        const maxPrice = parsePrice(maxRaw);
        const modalPrice = parsePrice(modalRaw);
        // Never silently convert a missing/invalid API price into 0.
        // A zero-price mandi record is not useful market data and previously hid
        // the field-name mismatch by successfully inserting fake zeroes.
        if (minPrice === null ||
            maxPrice === null ||
            modalPrice === null ||
            (minPrice === 0 && maxPrice === 0 && modalPrice === 0)) {
            skipped++;
            continue;
        }
        /*
         * Prisma's compound unique constraint contains nullable `variety`.
         * findFirst + update/create works for both:
         *   variety = "Local"
         *   variety = null
         */
        const existing = await prisma_1.default.mandiPrice.findFirst({
            where: {
                mandiId,
                cropId,
                priceDate,
                variety,
            },
            select: {
                id: true,
            },
        });
        if (existing) {
            await prisma_1.default.mandiPrice.update({
                where: {
                    id: existing.id,
                },
                data: {
                    minPrice,
                    maxPrice,
                    modalPrice,
                    source: 'EXTERNAL_API',
                },
            });
        }
        else {
            await prisma_1.default.mandiPrice.create({
                data: {
                    mandiId,
                    cropId,
                    variety,
                    minPrice,
                    maxPrice,
                    modalPrice,
                    priceDate,
                    source: 'EXTERNAL_API',
                },
            });
        }
        saved++;
    }
    return { saved, skipped };
}
async function syncYesterdayMandiData() {
    if (!API_KEY || !RESOURCE_ID) {
        logger_1.default.error('Mandi sync skipped: DATA_GOV_IN_API_KEY or DATA_GOV_IN_RESOURCE_ID is missing.');
        return;
    }
    const yesterday = getYesterday();
    logger_1.default.info(`🌾 Starting Mandi sync for ${yesterday}`);
    let offset = 0;
    let totalSaved = 0;
    let totalSkipped = 0;
    while (true) {
        const params = new URLSearchParams({
            'api-key': API_KEY,
            format: 'json',
            limit: String(CHUNK_SIZE),
            offset: String(offset),
            /*
             * Only fetch records whose Arrival_Date is yesterday.
             */
            'filters[Arrival_Date]': yesterday,
        });
        const url = `${BASE_URL}/${RESOURCE_ID}?${params.toString()}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`data.gov.in API error: ${response.status} ${response.statusText}`);
            }
            const data = (await response.json());
            const records = data.records ?? [];
            if (records.length === 0) {
                break;
            }
            logger_1.default.info(`📦 Mandi API returned ${records.length} records at offset ${offset}`);
            const result = await processChunk(records);
            totalSaved += result.saved;
            totalSkipped += result.skipped;
            /*
             * Move by the number actually received, not CHUNK_SIZE.
             * This prevents skipping records when the final page is smaller.
             */
            offset += records.length;
            if (records.length < CHUNK_SIZE) {
                break;
            }
            await sleep(DELAY_MS);
        }
        catch (error) {
            logger_1.default.error(`❌ Mandi sync failed at offset ${offset}`, error);
            throw error;
        }
    }
    logger_1.default.info(`✅ Mandi sync completed for ${yesterday}. Saved/updated: ${totalSaved}, skipped: ${totalSkipped}`);
}
/**
 * Start the daily cron.
 *
 * Runs every day at 2:00 AM IST and stores the previous day's
 * Mandi prices in the existing Mandi, Crop and MandiPrice tables.
 */
function startMandiDailyCron() {
    if (!API_KEY || !RESOURCE_ID) {
        logger_1.default.error('Mandi cron not started: DATA_GOV_IN_API_KEY or DATA_GOV_IN_RESOURCE_ID is missing.');
        return;
    }
    node_cron_1.default.schedule('0 2 * * *', async () => {
        logger_1.default.info('⏰ Mandi daily cron triggered');
        try {
            await syncYesterdayMandiData();
        }
        catch (error) {
            logger_1.default.error('❌ Mandi daily cron failed', error);
        }
    }, {
        timezone: 'Asia/Kolkata',
    });
    logger_1.default.info('⏰ Mandi daily cron scheduled for 2:00 AM IST');
}
//# sourceMappingURL=mandiDailyCron.js.map