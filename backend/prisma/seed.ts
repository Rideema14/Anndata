// Seeds the 7 marketplace categories from the spec, plus one admin account
// for local testing. Run with: npm run prisma:seed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');
}

const CATEGORIES = [
  { name: 'Seeds', description: 'Certified seeds across crop varieties.' },
  { name: 'Fertilizers', description: 'Organic and chemical fertilizers.' },
  { name: 'Farming Equipment', description: 'Hand tools and small farm equipment.' },
  { name: 'Machinery', description: 'Tractors, harvesters, and rentable heavy machinery.' },
  { name: 'Building Materials', description: 'Materials for farm structures and storage.' },
  { name: 'Oil Products', description: 'Agricultural and industrial oil products.' },
  { name: 'Milk & Dairy', description: 'Dairy products and dairy-farming supplies.' },
];

// A handful of the commodities that show up most often in Indian mandi price
// reporting — enough to exercise the Mandi Price Intelligence endpoints
// without requiring an admin to type these in by hand first.
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

async function main() {
  console.log('Seeding categories...');
  for (const cat of CATEGORIES) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: { name: cat.name, slug: slugify(cat.name), description: cat.description },
    });
  }

  console.log('Seeding crops...');
  for (const crop of CROPS) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.crop.upsert({
      where: { name: crop.name },
      update: {},
      create: crop,
    });
  }

  console.log('Seeding admin user...');
  const adminEmail = 'admin@agrimarketplace.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('ChangeMe123!', 10);
    await prisma.user.create({
      data: {
        name: 'Platform Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    console.log(`Admin created: ${adminEmail} / ChangeMe123! (change this immediately)`);
  } else {
    console.log('Admin already exists, skipping.');
  }

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
