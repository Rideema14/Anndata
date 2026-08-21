import fs from 'fs';
import path from 'path';
import logger from '../common/utils/logger';
import prisma from '../config/prisma';

const API_KEY = process.env.DATA_GOV_IN_API_KEY!;
const RESOURCE_ID = process.env.DATA_GOV_IN_RESOURCE_ID!;
const BASE_URL = process.env.DATA_GOV_IN_BASE_URL || 'https://api.data.gov.in/resource';
const STATE_FILE = path.join(process.cwd(), '.sync_state.json');
const CHUNK_SIZE = 5000;
const DELAY_MS = 2000;

interface SyncState {
  offset: number;
}

function loadState(): SyncState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    logger.error('Failed to read state file, starting from 0', err);
  }
  return { offset: 0 };
}

function saveState(state: SyncState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    logger.error('Failed to save state file', err);
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function startMetadataSync() {
  if (!API_KEY || !RESOURCE_ID) {
    logger.warn('Missing API Key or Resource ID in .env. Skipping Continuous Metadata Sync.');
    return;
  }

  const state = loadState();
  logger.info(`🚀 Starting Continuous Metadata Sync from offset ${state.offset}...`);

  // Run in background without blocking the main thread
  (async () => {
    while (true) {
      logger.info(`Fetching ${CHUNK_SIZE} records at offset ${state.offset}...`);
      
      const params = new URLSearchParams({
        'api-key': API_KEY,
        format: 'json',
        limit: String(CHUNK_SIZE),
        offset: String(state.offset),
      });

      const url = `${BASE_URL}/${RESOURCE_ID}?${params.toString()}`;

      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          logger.error(`API Error: ${response.status} ${response.statusText}. Waiting 10s...`);
          await sleep(10000);
          continue;
        }

        const data = await response.json();
        const records = data.records || [];
        const total = data.total || 0;

        if (records.length === 0) {
          logger.info(`✅ No more records found. Reached end of dataset (total: ${total}).`);
          break;
        }

        const uniqueCrops = new Set<string>();
        const uniqueMandis = new Map<string, { state: string, district: string, market: string }>();

        for (const record of records) {
          const { State, District, Market, Commodity } = record;
          
          if (Commodity) uniqueCrops.add(Commodity);
          
          if (State && District && Market) {
            const key = `${State}||${District}||${Market}`;
            if (!uniqueMandis.has(key)) {
              uniqueMandis.set(key, { state: State, district: District, market: Market });
            }
          }
        }

        logger.info(`Found ${uniqueCrops.size} unique crops and ${uniqueMandis.size} unique mandis in this chunk.`);

        // 1. Upsert Crops
        let newCrops = 0;
        for (const cropName of uniqueCrops) {
          const existing = await prisma.crop.findUnique({ where: { name: cropName } });
          if (!existing) {
            await prisma.crop.create({ data: { name: cropName } });
            newCrops++;
          }
        }

        // 2. Upsert Mandis
        let newMandis = 0;
        for (const m of uniqueMandis.values()) {
          const existing = await prisma.mandi.findUnique({
            where: { name_state_district: { name: m.market, state: m.state, district: m.district } }
          });
          if (!existing) {
            await prisma.mandi.create({ data: { name: m.market, state: m.state, district: m.district } });
            newMandis++;
          }
        }

        logger.info(`Saved ${newCrops} new crops and ${newMandis} new mandis to database.`);

        // Update state and save
        state.offset += CHUNK_SIZE;
        saveState(state);

        if (state.offset >= total) {
          logger.info(`✅ Finished syncing all ${total} records!`);
          break;
        }

        await sleep(DELAY_MS);

      } catch (err) {
        logger.error(`Network/Parse Error:`, err);
        logger.info(`Waiting 10 seconds before retrying...`);
        await sleep(10000);
      }
    }
  })();
}
