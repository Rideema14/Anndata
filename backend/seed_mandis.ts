/**
 * Seeds crops, mandis, and sample price data into the database.
 * Run with: npx tsx seed_mandis.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CROPS = [
  { name: 'Wheat', category: 'Cereals', unit: 'Quintal' },
  { name: 'Rice', category: 'Cereals', unit: 'Quintal' },
  { name: 'Onion', category: 'Vegetables', unit: 'Quintal' },
  { name: 'Tomato', category: 'Vegetables', unit: 'Quintal' },
  { name: 'Potato', category: 'Vegetables', unit: 'Quintal' },
  { name: 'Soybean', category: 'Oilseeds', unit: 'Quintal' },
  { name: 'Cotton', category: 'Fibres', unit: 'Quintal' },
  { name: 'Chana (Gram)', category: 'Pulses', unit: 'Quintal' },
];

const MANDIS = [
  { name: 'Katni Mandi', state: 'Madhya Pradesh', district: 'Katni', latitude: 23.83, longitude: 80.40 },
  { name: 'Bhopal Mandi', state: 'Madhya Pradesh', district: 'Bhopal', latitude: 23.26, longitude: 77.41 },
  { name: 'Indore Mandi', state: 'Madhya Pradesh', district: 'Indore', latitude: 22.72, longitude: 75.86 },
  { name: 'Pune APMC', state: 'Maharashtra', district: 'Pune', latitude: 18.52, longitude: 73.85 },
  { name: 'Nashik APMC', state: 'Maharashtra', district: 'Nashik', latitude: 20.00, longitude: 73.78 },
  { name: 'Nagpur APMC', state: 'Maharashtra', district: 'Nagpur', latitude: 21.14, longitude: 79.09 },
  { name: 'Azadpur Mandi', state: 'Delhi', district: 'North Delhi', latitude: 28.70, longitude: 77.18 },
  { name: 'Ludhiana Mandi', state: 'Punjab', district: 'Ludhiana', latitude: 30.90, longitude: 75.86 },
  { name: 'Amritsar Mandi', state: 'Punjab', district: 'Amritsar', latitude: 31.63, longitude: 74.87 },
  { name: 'Jaipur Mandi', state: 'Rajasthan', district: 'Jaipur', latitude: 26.92, longitude: 75.79 },
  { name: 'Lucknow Mandi', state: 'Uttar Pradesh', district: 'Lucknow', latitude: 26.85, longitude: 80.95 },
  { name: 'Varanasi Mandi', state: 'Uttar Pradesh', district: 'Varanasi', latitude: 25.32, longitude: 83.01 },
];

// Base prices per crop (₹ per quintal) — realistic Indian mandi ranges
const BASE_PRICES: Record<string, { min: number; max: number }> = {
  Wheat: { min: 2100, max: 2600 },
  Rice: { min: 2800, max: 3600 },
  Onion: { min: 800, max: 2200 },
  Tomato: { min: 500, max: 3000 },
  Potato: { min: 600, max: 1500 },
  Soybean: { min: 4200, max: 5200 },
  Cotton: { min: 5800, max: 7200 },
  'Chana (Gram)': { min: 4400, max: 5800 },
};

function randomBetween(a: number, b: number) {
  return Math.round(a + Math.random() * (b - a));
}

async function main() {
  console.log('=== Seeding Crops ===');
  const cropIds: string[] = [];
  for (const crop of CROPS) {
    const record = await prisma.crop.upsert({
      where: { name: crop.name },
      update: {},
      create: crop,
    });
    cropIds.push(record.id);
    console.log(`  Crop: ${crop.name} (${record.id})`);
  }

  console.log('\n=== Seeding Mandis ===');
  const mandiRecords: { id: string; name: string }[] = [];
  for (const m of MANDIS) {
    const record = await prisma.mandi.upsert({
      where: { name_state_district: { name: m.name, state: m.state, district: m.district } },
      update: {},
      create: m,
    });
    mandiRecords.push({ id: record.id, name: m.name });
    console.log(`  Mandi: ${m.name} — ${m.district}, ${m.state} (${record.id})`);
  }

  console.log('\n=== Seeding Prices (last 30 days) ===');
  let priceCount = 0;
  const today = new Date();

  for (const mandi of mandiRecords) {
    for (let i = 0; i < CROPS.length; i++) {
      const cropName = CROPS[i].name;
      const base = BASE_PRICES[cropName];

      // Create prices for the last 30 days
      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        const priceDate = new Date(today);
        priceDate.setDate(priceDate.getDate() - dayOffset);
        // Zero out time — the column is @db.Date
        priceDate.setHours(0, 0, 0, 0);

        const minPrice = randomBetween(base.min, base.min + 300);
        const maxPrice = randomBetween(base.max - 200, base.max);
        const modalPrice = randomBetween(minPrice + 50, maxPrice - 50);

        await prisma.mandiPrice.upsert({
          where: {
            mandiId_cropId_variety_priceDate: {
              mandiId: mandi.id,
              cropId: cropIds[i],
              variety: 'Local',
              priceDate,
            },
          },
          update: { minPrice, maxPrice, modalPrice },
          create: {
            mandiId: mandi.id,
            cropId: cropIds[i],
            variety: 'Local',
            minPrice,
            maxPrice,
            modalPrice,
            priceDate,
            source: 'ADMIN',
          },
        });
        priceCount++;
      }
    }
  }

  console.log(`  Created/updated ${priceCount} price records.`);
  console.log('\n✅ Seeding complete!');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
