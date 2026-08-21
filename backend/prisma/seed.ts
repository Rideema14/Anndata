// Seeds the 7 marketplace categories, one admin account, 6 approved sellers
// with product catalogs, and a handful of buyer accounts — for local
// marketplace testing/demo. Safe to re-run — every write is an upsert keyed
// on a unique field (email / slug), so running this twice won't duplicate
// data or throw.
//
// Run with: npm run prisma:seed
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const processRef = (globalThis as typeof globalThis & {
  process?: {
    exit: (code?: number) => never;
  };
}).process;

const prisma = new PrismaClient();

// Every seeded seller/buyer account shares this password so the credentials
// list at the bottom of this file stays short. Change/remove before any
// shared or production deployment.
const DEMO_PASSWORD = 'Demo@1234';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-');
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { name: 'Seeds', description: 'Certified seeds across crop varieties.' },
  { name: 'Fertilizers', description: 'Organic and chemical fertilizers.' },
  { name: 'Farming Equipment', description: 'Hand tools and small farm equipment.' },
  { name: 'Machinery', description: 'Tractors, harvesters, and rentable heavy machinery.' },
  { name: 'Building Materials', description: 'Materials for farm structures and storage.' },
  { name: 'Oil Products', description: 'Agricultural and industrial oil products.' },
  { name: 'Milk & Dairy', description: 'Dairy products and dairy-farming supplies.' },
];

// ---------------------------------------------------------------------------
// Sellers — one per major category, each with an approved profile and a
// small product catalog. Coordinates are real city centers so "nearby
// products" (Haversine) has something to actually sort by distance.
// ---------------------------------------------------------------------------

interface SeedProduct {
  name: string;
  price: number;
  discountPrice?: number;
  stock: number;
  unit: string;
  description: string;
  specifications?: Record<string, string>;
}

interface SeedSeller {
  email: string;
  name: string;
  businessName: string;
  businessDescription: string;
  city: string;
  lat: number;
  lng: number;
  categoryName: string;
  products: SeedProduct[];
}

const SELLERS: SeedSeller[] = [
  {
    email: 'seller.seeds@agrimarketplace.com',
    name: 'Ramesh Patidar',
    businessName: 'Patidar Seed Co.',
    businessDescription: 'Certified hybrid and open-pollinated seeds sourced directly from growers.',
    city: 'Indore',
    lat: 22.7196,
    lng: 75.8577,
    categoryName: 'Seeds',
    products: [
      { name: 'Hybrid Wheat Seeds (HD-2967)', price: 1450, discountPrice: 1299, stock: 320, unit: 'bag', description: 'High-yield disease-resistant wheat variety suited for central Indian soils.', specifications: { 'Germination Rate': '92%', 'Pack Size': '40 kg', Season: 'Rabi' } },
      { name: 'Soybean Seeds (JS-335)', price: 2100, stock: 210, unit: 'bag', description: 'Popular short-duration soybean variety with strong pod-setting.', specifications: { 'Germination Rate': '88%', 'Pack Size': '30 kg', Season: 'Kharif' } },
      { name: 'Hybrid Cotton Seeds', price: 890, discountPrice: 799, stock: 150, unit: 'packet', description: 'Bt cotton hybrid with good boll retention and pest tolerance.', specifications: { 'Pack Size': '450 g', Season: 'Kharif' } },
      { name: 'Maize Seeds (Hybrid)', price: 650, stock: 400, unit: 'bag', description: 'Fast-maturing maize hybrid for grain and fodder use.', specifications: { 'Pack Size': '4 kg', Season: 'Kharif/Rabi' } },
    ],
  },
  {
    email: 'seller.fertilizers@agrimarketplace.com',
    name: 'Suresh Chouhan',
    businessName: 'Chouhan Agro Fertilizers',
    businessDescription: 'Organic and chemical fertilizer distributor serving Malwa-region farmers.',
    city: 'Ujjain',
    lat: 23.1793,
    lng: 75.7849,
    categoryName: 'Fertilizers',
    products: [
      { name: 'DAP Fertilizer', price: 1350, stock: 500, unit: 'bag', description: 'Diammonium phosphate for strong root development.', specifications: { 'Pack Size': '50 kg', NPK: '18-46-0' } },
      { name: 'Urea (Neem Coated)', price: 380, discountPrice: 349, stock: 800, unit: 'bag', description: 'Slow-release neem-coated urea for reduced nitrogen loss.', specifications: { 'Pack Size': '45 kg', Nitrogen: '46%' } },
      { name: 'Vermicompost (Organic)', price: 420, stock: 260, unit: 'bag', description: '100% organic vermicompost enriched with earthworm castings.', specifications: { 'Pack Size': '25 kg', Type: 'Organic' } },
      { name: 'Potash (MOP)', price: 990, stock: 300, unit: 'bag', description: 'Muriate of potash for fruit and grain quality improvement.', specifications: { 'Pack Size': '50 kg', 'K2O': '60%' } },
    ],
  },
  {
    email: 'seller.equipment@agrimarketplace.com',
    name: 'Vikram Solanki',
    businessName: 'Solanki Farm Tools',
    businessDescription: 'Hand tools and small farm equipment, from sickles to sprayers.',
    city: 'Dewas',
    lat: 22.9623,
    lng: 76.0534,
    categoryName: 'Farming Equipment',
    products: [
      { name: 'Manual Knapsack Sprayer (16L)', price: 1650, discountPrice: 1499, stock: 90, unit: 'piece', description: 'Durable 16-litre manual sprayer with adjustable nozzle.', specifications: { Capacity: '16 L', Material: 'HDPE' } },
      { name: 'Sickle Set (Pack of 5)', price: 550, stock: 200, unit: 'set', description: 'Forged steel sickles for harvesting, pack of five.', specifications: { Material: 'Carbon Steel' } },
      { name: 'Garden Hoe (Khurpi)', price: 180, stock: 350, unit: 'piece', description: 'Hand hoe for weeding and light tilling.', specifications: { Length: '30 cm' } },
      { name: 'Battery Sprayer (12V)', price: 3200, discountPrice: 2899, stock: 60, unit: 'piece', description: 'Rechargeable battery-powered sprayer, 8 hours backup.', specifications: { Capacity: '16 L', Battery: '12V 8Ah' } },
    ],
  },
  {
    email: 'seller.machinery@agrimarketplace.com',
    name: 'Harpreet Singh',
    businessName: 'Singh Machinery Rentals',
    businessDescription: 'Tractors, tillers, and harvesters for sale and seasonal rental.',
    city: 'Bhopal',
    lat: 23.2599,
    lng: 77.4126,
    categoryName: 'Machinery',
    products: [
      { name: 'Rotary Tiller (5 ft)', price: 48000, discountPrice: 44500, stock: 12, unit: 'piece', description: 'Heavy-duty rotary tiller compatible with 35-50 HP tractors.', specifications: { Width: '5 ft', 'Power Required': '35-50 HP' } },
      { name: 'Power Weeder (7 HP)', price: 62000, stock: 8, unit: 'piece', description: 'Diesel power weeder for inter-row cultivation.', specifications: { Engine: '7 HP Diesel' } },
      { name: 'Chaff Cutter (Electric)', price: 15500, discountPrice: 13999, stock: 20, unit: 'piece', description: 'Electric chaff cutter for fodder processing.', specifications: { Power: '3 HP Motor' } },
      { name: 'Mini Tractor (18 HP)', price: 285000, stock: 3, unit: 'piece', description: 'Compact 18 HP tractor suited for small and orchard farms.', specifications: { Power: '18 HP', Drive: '2WD' } },
    ],
  },
  {
    email: 'seller.building@agrimarketplace.com',
    name: 'Anil Verma',
    businessName: 'Verma Farm Structures',
    businessDescription: 'Materials for storage sheds, fencing, and farm structures.',
    city: 'Sehore',
    lat: 23.2032,
    lng: 77.0850,
    categoryName: 'Building Materials',
    products: [
      { name: 'Galvanized Fencing Wire (Roll)', price: 2400, stock: 140, unit: 'roll', description: 'Rust-resistant galvanized wire for farm boundary fencing.', specifications: { Length: '100 m', Gauge: '12' } },
      { name: 'Corrugated Roofing Sheets', price: 780, discountPrice: 699, stock: 500, unit: 'piece', description: 'Weatherproof sheets for shed and storage roofing.', specifications: { Size: '8 ft x 2 ft' } },
      { name: 'Cement (OPC 53 Grade)', price: 410, stock: 600, unit: 'bag', description: 'General-purpose cement suitable for farm construction.', specifications: { 'Pack Size': '50 kg' } },
      { name: 'PVC Storage Tank (1000L)', price: 6200, stock: 45, unit: 'piece', description: 'Food-grade PVC tank for water and grain storage.', specifications: { Capacity: '1000 L' } },
    ],
  },
  {
    email: 'seller.dairy@agrimarketplace.com',
    name: 'Meena Yadav',
    businessName: 'Yadav Dairy & Oils',
    businessDescription: 'Dairy products and cold-pressed oils sourced from local cooperatives.',
    city: 'Dhar',
    lat: 22.6013,
    lng: 75.3007,
    categoryName: 'Milk & Dairy',
    products: [
      { name: 'Cold-Pressed Mustard Oil', price: 320, discountPrice: 289, stock: 240, unit: 'litre', description: 'Traditional wooden cold-pressed mustard oil, unfiltered.', specifications: { Volume: '1 L', Process: 'Cold-Pressed' } },
      { name: 'Groundnut Oil (Filtered)', price: 260, stock: 180, unit: 'litre', description: 'Refined groundnut oil for cooking and farm use.', specifications: { Volume: '1 L' } },
      { name: 'Desi Cow Ghee', price: 780, discountPrice: 699, stock: 100, unit: 'jar', description: 'Pure desi cow ghee made using the traditional bilona method.', specifications: { Weight: '500 g' } },
      { name: 'Paneer (Fresh, 1kg)', price: 340, stock: 60, unit: 'pack', description: 'Fresh farm paneer, made daily from cow milk.', specifications: { Weight: '1 kg' } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Buyers
// ---------------------------------------------------------------------------

interface SeedBuyer {
  email: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  postalCode: string;
  lat: number;
  lng: number;
}

const BUYERS: SeedBuyer[] = [
  { email: 'buyer.arjun@agrimarketplace.com', name: 'Arjun Mehta', phone: '9876500001', city: 'Indore', state: 'Madhya Pradesh', postalCode: '452001', lat: 22.7196, lng: 75.8577 },
  { email: 'buyer.priya@agrimarketplace.com', name: 'Priya Sharma', phone: '9876500002', city: 'Bhopal', state: 'Madhya Pradesh', postalCode: '462001', lat: 23.2599, lng: 77.4126 },
  { email: 'buyer.rohit@agrimarketplace.com', name: 'Rohit Kumar', phone: '9876500003', city: 'Ujjain', state: 'Madhya Pradesh', postalCode: '456001', lat: 23.1793, lng: 75.7849 },
  { email: 'buyer.sneha@agrimarketplace.com', name: 'Sneha Rathore', phone: '9876500004', city: 'Dewas', state: 'Madhya Pradesh', postalCode: '455001', lat: 22.9623, lng: 76.0534 },
];

async function main() {
  console.log('Seeding categories...');
  const categoryBySlug = new Map<string, { id: string }>();
  for (const cat of CATEGORIES) {
    const slug = slugify(cat.name);
    // eslint-disable-next-line no-await-in-loop
    const created = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: cat.name, slug, description: cat.description },
    });
    categoryBySlug.set(slug, created);
  }

  console.log('Seeding admin user...');
  const adminEmail = 'admin@agrimarketplace.com';
  const adminPasswordHash = await bcrypt.hash('ChangeMe123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Platform Admin',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.log(`Admin ready: ${adminEmail} / ChangeMe123!`);

  console.log('Seeding sellers + products...');
  const demoPasswordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const allProductIds: string[] = [];

  for (const seller of SELLERS) {
    const category = categoryBySlug.get(slugify(seller.categoryName));
    if (!category) {
      console.warn(`Skipping seller ${seller.email} — category "${seller.categoryName}" not found.`);
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const user = await prisma.user.upsert({
      where: { email: seller.email },
      update: {},
      create: {
        name: seller.name,
        email: seller.email,
        passwordHash: demoPasswordHash,
        role: 'SELLER',
        isEmailVerified: true,
        latitude: seller.lat,
        longitude: seller.lng,
      },
    });

    // eslint-disable-next-line no-await-in-loop
    await prisma.sellerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: seller.businessName,
        businessDescription: seller.businessDescription,
        verificationStatus: 'APPROVED',
        reviewedById: admin.id,
        reviewedAt: new Date(),
        bankAccountHolder: seller.name,
        bankAccountNumber: '000000000000',
        bankIfscCode: 'SBIN0000001',
        bankName: 'State Bank of India',
        serviceAreaLat: seller.lat,
        serviceAreaLng: seller.lng,
        serviceAreaRadiusKm: 75,
      },
    });

    for (const product of seller.products) {
      const slug = slugify(`${product.name}-${seller.businessName}`);
      // eslint-disable-next-line no-await-in-loop
      const createdProduct = await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          sellerId: user.id,
          categoryId: category.id,
          name: product.name,
          slug,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice ?? null,
          stock: product.stock,
          unit: product.unit,
          specifications: product.specifications ?? undefined,
          latitude: seller.lat,
          longitude: seller.lng,
          isActive: true,
        },
      });
      allProductIds.push(createdProduct.id);

      // eslint-disable-next-line no-await-in-loop
      const existingImage = await prisma.productImage.findFirst({ where: { productId: createdProduct.id } });
      if (!existingImage) {
        // eslint-disable-next-line no-await-in-loop
        await prisma.productImage.create({
          data: {
            productId: createdProduct.id,
            url: `https://picsum.photos/seed/${slug}/600/600`,
            isPrimary: true,
            sortOrder: 0,
          },
        });
      }
    }
    console.log(`  - ${seller.businessName} (${seller.email}) with ${seller.products.length} products`);
  }

  console.log('Seeding buyers...');
  const buyerIds: string[] = [];
  for (const buyer of BUYERS) {
    // eslint-disable-next-line no-await-in-loop
    const user = await prisma.user.upsert({
      where: { email: buyer.email },
      update: {},
      create: {
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        passwordHash: demoPasswordHash,
        role: 'BUYER',
        isEmailVerified: true,
        latitude: buyer.lat,
        longitude: buyer.lng,
      },
    });
    buyerIds.push(user.id);

    // eslint-disable-next-line no-await-in-loop
    const existingAddress = await prisma.address.findFirst({ where: { userId: user.id } });
    if (!existingAddress) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.address.create({
        data: {
          userId: user.id,
          label: 'Home',
          fullName: buyer.name,
          phone: buyer.phone,
          addressLine1: '12 Farmer Colony',
          city: buyer.city,
          state: buyer.state,
          postalCode: buyer.postalCode,
          latitude: buyer.lat,
          longitude: buyer.lng,
          isDefault: true,
        },
      });
    }
    console.log(`  - ${buyer.name} (${buyer.email})`);
  }

  console.log('Seeding a few product reviews...');
  const sampleReviews = [
    { rating: 5, comment: 'Great quality, delivered on time.' },
    { rating: 4, comment: 'Good product, works as described.' },
    { rating: 5, comment: 'Will buy again, trustworthy seller.' },
  ];
  for (let i = 0; i < Math.min(allProductIds.length, buyerIds.length * 3); i += 1) {
    const productId = allProductIds[i];
    const buyerId = buyerIds[i % buyerIds.length];
    const review = sampleReviews[i % sampleReviews.length];
    // eslint-disable-next-line no-await-in-loop
    await prisma.review.upsert({
      where: { productId_userId: { productId, userId: buyerId } },
      update: {},
      create: { productId, userId: buyerId, rating: review.rating, comment: review.comment },
    });
    // eslint-disable-next-line no-await-in-loop
    const agg = await prisma.review.aggregate({ where: { productId }, _avg: { rating: true }, _count: true });
    // eslint-disable-next-line no-await-in-loop
    await prisma.product.update({
      where: { id: productId },
      data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count },
    });
  }

  console.log('\nSeed complete. Demo login credentials:\n');
  console.log(`  Admin    : ${adminEmail} / ChangeMe123!`);
  for (const seller of SELLERS) {
    console.log(`  Seller   : ${seller.email} / ${DEMO_PASSWORD}  (${seller.businessName})`);
  }
  for (const buyer of BUYERS) {
    console.log(`  Buyer    : ${buyer.email} / ${DEMO_PASSWORD}  (${buyer.name})`);
  }
  console.log('\nAll accounts are pre-verified (isEmailVerified: true) so you can log in immediately — no OTP needed.');
}

main()
  .catch((err) => {
    console.error(err);
    processRef?.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });