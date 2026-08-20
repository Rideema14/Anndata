/**
 * Continuous Metadata Syncer
 * Run with: npx tsx continuous_metadata_sync.ts
 * 
 * Fetches chunks of data from data.gov.in, extracts only the States, Districts,
 * Markets, and Commodities, and saves them to the local Postgres database.
 * Progress is saved to .sync_state.json so it can be resumed at any time.
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

const API_KEY = process.env.DATA_GOV_IN_API_KEY!;
const RESOURCE_ID = process.env.DATA_GOV_IN_RESOURCE_ID!;
const BASE_URL = process.env.DATA_GOV_IN_BASE_URL || 'https://api.data.gov.in/resource';
const STATE_FILE = path.join(__dirname, '.sync_state.json');
const CHUNK_SIZE = 2000;
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
    console.error('Failed to read state file, starting from 0', err);
  }
  return { offset: 0 };
}

function saveState(state: SyncState) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save state file', err);
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  if (!API_KEY || !RESOURCE_ID) {
    console.error('Missing API Key or Resource ID in .env');
    process.exit(1);
  }

  const state = loadState();
  console.log(`🚀 Starting Continuous Metadata Sync from offset ${state.offset}...`);
  console.log(`(Press Ctrl+C to stop at any time. Progress is saved automatically.)\n`);

  while (true) {
    console.log(`\nFetching ${CHUNK_SIZE} records at offset ${state.offset}...`);
    
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
        console.error(`  ❌ API Error: ${response.status} ${response.statusText}`);
        console.log(`  Waiting 10 seconds before retrying...`);
        await sleep(10000);
        continue;
      }

      const data = await response.json();
      const records = data.records || [];
      const total = data.total || 0;

      if (records.length === 0) {
        console.log(`  ✅ No more records found. Reached end of dataset (total: ${total}).`);
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

      console.log(`  🔍 Found ${uniqueCrops.size} unique crops and ${uniqueMandis.size} unique mandis in this chunk.`);

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

      console.log(`  💾 Saved ${newCrops} new crops and ${newMandis} new mandis to database.`);

      // Update state and save
      state.offset += CHUNK_SIZE;
      saveState(state);

      if (state.offset >= total) {
        console.log(`  ✅ Finished syncing all ${total} records!`);
        break;
      }

      // Rate limiting
      console.log(`  ⏳ Sleeping for ${DELAY_MS}ms...`);
      await sleep(DELAY_MS);

    } catch (err) {
      console.error(`  ❌ Network/Parse Error:`, err);
      console.log(`  Waiting 10 seconds before retrying...`);
      await sleep(10000);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
