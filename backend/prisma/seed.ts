import { PrismaClient, Role, MachineryBookingStatus, PaymentStatus } from '@prisma/client';
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

const MACHINERY_CATEGORIES = [
  {
    name: 'Tractors',
    description: 'Heavy duty, utility, and compact tractors for plowing, hauling, and field operations.',
    imageUrl: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Harvesters & Combines',
    description: 'High-efficiency combine harvesters, paddy reapers, and grain threshing machinery.',
    imageUrl: 'https://images.unsplash.com/photo-1595838788344-93335552b97c?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Tillage & Soil Prep',
    description: 'Rotavators, disc harrows, cultivators, subsoilers, and laser land levelers.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Sowing & Planting',
    description: 'Pneumatic seed drills, multi-crop planters, and automatic paddy transplanters.',
    imageUrl: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Sprayers & Protection',
    description: 'Tractor-mounted boom sprayers, orchard mist sprayers, and crop protection drones.',
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop',
  },
];

async function main() {
  console.log('Seeding marketplace categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: {},
      create: { name: cat.name, slug: slugify(cat.name), description: cat.description },
    });
  }

  console.log('Seeding crops...');
  for (const crop of CROPS) {
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
        role: Role.ADMIN,
        isEmailVerified: true,
      },
    });
    console.log(`Admin created: ${adminEmail} / ChangeMe123!`);
  }

  console.log('Seeding demo seller and farmer/renter accounts...');
  const defaultPasswordHash = await bcrypt.hash('Demo1234!', 10);

  // Helper to safely find or create demo user
  async function findOrCreateUser(params: {
    email: string;
    name: string;
    phone: string;
    role: Role;
    profileImage: string;
    businessName?: string;
    businessDescription?: string;
    gstNumber?: string;
  }) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ email: params.email }, { phone: params.phone }] },
      include: { sellerProfile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: params.name,
          email: params.email,
          phone: params.phone,
          passwordHash: defaultPasswordHash,
          role: params.role,
          isEmailVerified: true,
          isPhoneVerified: true,
          profileImage: params.profileImage,
          sellerProfile: params.businessName
            ? {
                create: {
                  businessName: params.businessName,
                  businessDescription: params.businessDescription,
                  gstNumber: params.gstNumber,
                  verificationStatus: 'APPROVED',
                },
              }
            : undefined,
        },
        include: { sellerProfile: true },
      });
    }
    return user;
  }

  // Seller 1
  const seller1 = await findOrCreateUser({
    email: 'seller.ramesh@agrimarketplace.com',
    name: 'Ramesh Equipment & Machinery',
    phone: '+919876543210',
    role: Role.SELLER,
    profileImage: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400&auto=format&fit=crop',
    businessName: 'Ramesh Agro Machinery Rentals',
    businessDescription: 'Providing top-quality tractors, rotavators, and field equipment across Punjab & Haryana.',
    gstNumber: '03AAAAA0000A1Z5',
  });

  // Seller 2
  const seller2 = await findOrCreateUser({
    email: 'seller.kisan@agrimarketplace.com',
    name: 'Kisan Heavy Agro Fleet',
    phone: '+919876543211',
    role: Role.SELLER,
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
    businessName: 'Kisan Fleet Solutions',
    businessDescription: 'Specialized combine harvesters and high-tech agricultural spraying drones.',
    gstNumber: '07BBBBB1111B1Z2',
  });

  // Renter 1 (Farmer)
  const renter1 = await findOrCreateUser({
    email: 'farmer.ram@agrimarketplace.com',
    name: 'Ram Singh (Farmer)',
    phone: '+919876543212',
    role: Role.BUYER,
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
  });

  // Renter 2 (Farmer)
  const renter2 = await findOrCreateUser({
    email: 'farmer.vikram@agrimarketplace.com',
    name: 'Vikram Patel',
    phone: '+919876543213',
    role: Role.BUYER,
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
  });

  console.log('Seeding machinery categories...');
  const categoryMap = new Map<string, string>();
  for (const cat of MACHINERY_CATEGORIES) {
    const slug = slugify(cat.name);
    const dbCat = await prisma.machineryCategory.upsert({
      where: { slug },
      update: { description: cat.description, imageUrl: cat.imageUrl },
      create: {
        name: cat.name,
        slug,
        description: cat.description,
        imageUrl: cat.imageUrl,
        isActive: true,
      },
    });
    categoryMap.set(slug, dbCat.id);
  }

  console.log('Seeding machinery listings...');

  // Machinery Listing 1: Mahindra Tractor
  const m1Slug = 'mahindra-575-di-tractor-45hp';
  const m1 = await prisma.machinery.upsert({
    where: { slug: m1Slug },
    update: {},
    create: {
      sellerId: seller1.id,
      categoryId: categoryMap.get('tractors')!,
      name: 'Mahindra 575 DI Tractor (45 HP)',
      slug: m1Slug,
      brand: 'Mahindra',
      model: '575 DI',
      description: 'Reliable 45 HP 2WD tractor perfect for heavy plowing, rotavator operation, and trolley transport. Comes with dual-clutch and oil-immersed brakes.',
      totalUnits: 3,
      pricePerDay: 1500,
      bufferDays: 1,
      latitude: 30.7333,
      longitude: 76.7794,
      avgRating: 4.8,
      reviewCount: 1,
      specifications: {
        HorsePower: '45 HP',
        Cylinders: 4,
        FuelTankCapacity: '60 Liters',
        DriveType: '2WD',
        PTOPower: '39.8 HP',
        LiftingCapacity: '1600 kg',
      },
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?q=80&w=800&auto=format&fit=crop', isPrimary: true, sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1535379453347-1ffd615e2e08?q=80&w=800&auto=format&fit=crop', isPrimary: false, sortOrder: 1 },
        ],
      },
      discountTiers: {
        create: [
          { minQuantity: 3, discountPercent: 5.0 },
          { minQuantity: 7, discountPercent: 12.0 },
        ],
      },
    },
  });

  // Machinery Listing 2: John Deere Tractor
  const m2Slug = 'john-deere-5050d-tractor-50hp-4wd';
  const m2 = await prisma.machinery.upsert({
    where: { slug: m2Slug },
    update: {},
    create: {
      sellerId: seller1.id,
      categoryId: categoryMap.get('tractors')!,
      name: 'John Deere 5050D Tractor (50 HP 4WD)',
      slug: m2Slug,
      brand: 'John Deere',
      model: '5050D',
      description: 'High-performance 50 HP 4WD tractor suited for puddling, heavy soil preparation, and commercial farm attachments.',
      totalUnits: 2,
      pricePerDay: 2200,
      bufferDays: 1,
      latitude: 30.901,
      longitude: 75.8573,
      avgRating: 5.0,
      reviewCount: 1,
      specifications: {
        HorsePower: '50 HP',
        DriveType: '4WD',
        HydraulicCapacity: '1600 kg',
        Steering: 'Power Steering',
      },
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=800&auto=format&fit=crop', isPrimary: true, sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?q=80&w=800&auto=format&fit=crop', isPrimary: false, sortOrder: 1 },
        ],
      },
    },
  });

  // Machinery Listing 3: Kubota Combine Harvester
  const m3Slug = 'kubota-harvestking-combine-harvester';
  const m3 = await prisma.machinery.upsert({
    where: { slug: m3Slug },
    update: {},
    create: {
      sellerId: seller2.id,
      categoryId: categoryMap.get('harvesters-combines')!,
      name: 'Kubota HARVESTKING Multi-Crop Combine Harvester',
      slug: m3Slug,
      brand: 'Kubota',
      model: 'DC-68G-HK',
      description: 'Self-propelled paddy and wheat combine harvester with rubber crawlers for smooth operation in wet or muddy paddy fields.',
      totalUnits: 2,
      pricePerDay: 5500,
      bufferDays: 2,
      latitude: 28.6139,
      longitude: 77.209,
      avgRating: 4.9,
      reviewCount: 1,
      specifications: {
        EnginePower: '68 HP',
        CuttingWidth: '2.0 meters',
        GrainTankCapacity: '1200 Liters',
        FuelEfficiency: 'High (Diesel)',
      },
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1595838788344-93335552b97c?q=80&w=800&auto=format&fit=crop', isPrimary: true, sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop', isPrimary: false, sortOrder: 1 },
        ],
      },
    },
  });

  // Machinery Listing 4: Shaktiman Rotavator
  const m4Slug = 'shaktiman-heavy-duty-rotavator-7ft';
  const m4 = await prisma.machinery.upsert({
    where: { slug: m4Slug },
    update: {},
    create: {
      sellerId: seller1.id,
      categoryId: categoryMap.get('tillage-soil-prep')!,
      name: 'Shaktiman Heavy Duty Rotavator (7 Feet)',
      slug: m4Slug,
      brand: 'Shaktiman',
      model: 'Semi Champion 7ft',
      description: 'Ideal tractor implement for secondary seedbed preparation, stubble crushing, and soil mixing. Works best with 45-55 HP tractors.',
      totalUnits: 4,
      pricePerDay: 800,
      bufferDays: 1,
      latitude: 30.7333,
      longitude: 76.7794,
      avgRating: 4.7,
      reviewCount: 0,
      specifications: {
        WorkingWidth: '7 Feet (2.1m)',
        NoOfBlades: 48,
        TractorHPRequired: '45-55 HP',
        GearboxType: 'Multi-speed',
      },
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop', isPrimary: true, sortOrder: 0 },
        ],
      },
    },
  });

  // Machinery Listing 5: Precision Spraying Drone
  const m5Slug = 'agrifly-precision-spraying-drone-16l';
  const m5 = await prisma.machinery.upsert({
    where: { slug: m5Slug },
    update: {},
    create: {
      sellerId: seller2.id,
      categoryId: categoryMap.get('sprayers-protection')!,
      name: 'AgriFly Precision Crop Spraying Drone (16L)',
      slug: m5Slug,
      brand: 'AgriFly',
      model: 'T30-CropGuard',
      description: 'High-speed autonomous spraying drone equipped with radar terrain sensing and multi-atomizing nozzles. Includes trained operator.',
      totalUnits: 3,
      pricePerDay: 3000,
      bufferDays: 1,
      latitude: 28.6139,
      longitude: 77.209,
      avgRating: 5.0,
      reviewCount: 1,
      specifications: {
        PayloadCapacity: '16 Liters',
        SprayWidth: '6.5 meters',
        CoverageRate: 'Up to 25 acres/day',
        FlightTimePerBattery: '18 minutes',
        IncludesOperator: 'Yes',
      },
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=800&auto=format&fit=crop', isPrimary: true, sortOrder: 0 },
          { url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?q=80&w=800&auto=format&fit=crop', isPrimary: false, sortOrder: 1 },
        ],
      },
    },
  });

  console.log('Seeding demo machinery bookings, payments & reviews...');

  // Booking 1: Completed Mahindra Tractor booking by Ram Singh
  const booking1Number = 'MB-2026-001';
  const startDate1 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
  const endDate1 = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000); // 4 days ago (3 days)
  const pricePerDay1 = 1500;
  const days1 = 3;
  const subtotal1 = pricePerDay1 * days1; // 4500
  const tax1 = subtotal1 * 0.05; // 225
  const totalAmount1 = subtotal1 + tax1; // 4725

  const existingB1 = await prisma.machineryBooking.findUnique({ where: { bookingNumber: booking1Number } });
  if (!existingB1) {
    const b1 = await prisma.machineryBooking.create({
      data: {
        bookingNumber: booking1Number,
        machineryId: m1.id,
        userId: renter1.id,
        quantity: 1,
        startDate: startDate1,
        endDate: endDate1,
        pricePerDaySnapshot: pricePerDay1,
        discountPercentApplied: 5.0, // 3 days discount
        subtotal: subtotal1,
        tax: tax1,
        totalAmount: totalAmount1,
        status: MachineryBookingStatus.COMPLETED,
        notes: 'Plowing 10 acres of wheat field.',
        statusHistory: {
          create: [
            { status: MachineryBookingStatus.PENDING, note: 'Booking request created' },
            { status: MachineryBookingStatus.CONFIRMED, note: 'Payment received. Booking confirmed.' },
            { status: MachineryBookingStatus.ACTIVE, note: 'Tractor delivered to field.' },
            { status: MachineryBookingStatus.COMPLETED, note: 'Tractor returned safely in great condition.' },
          ],
        },
        payment: {
          create: {
            userId: renter1.id,
            razorpayOrderId: 'order_demo_machinery_001',
            razorpayPaymentId: 'pay_demo_machinery_001',
            amount: totalAmount1,
            currency: 'INR',
            status: PaymentStatus.PAID,
            method: 'upi',
          },
        },
      },
    });

    // Add review for booking 1
    await prisma.machineryReview.create({
      data: {
        machineryId: m1.id,
        userId: renter1.id,
        bookingId: b1.id,
        rating: 5,
        comment: 'Excellent tractor! Very clean, well maintained, and delivered right on time to my farm. Plowing was super smooth.',
        isApproved: true,
      },
    });
  }

  // Booking 2: Active Drone Spraying booking by Ram Singh
  const booking2Number = 'MB-2026-002';
  const startDate2 = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
  const endDate2 = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day from now
  const pricePerDay2 = 3000;
  const days2 = 2;
  const subtotal2 = pricePerDay2 * days2;
  const tax2 = subtotal2 * 0.05;
  const totalAmount2 = subtotal2 + tax2;

  const existingB2 = await prisma.machineryBooking.findUnique({ where: { bookingNumber: booking2Number } });
  if (!existingB2) {
    await prisma.machineryBooking.create({
      data: {
        bookingNumber: booking2Number,
        machineryId: m5.id,
        userId: renter1.id,
        quantity: 1,
        startDate: startDate2,
        endDate: endDate2,
        pricePerDaySnapshot: pricePerDay2,
        discountPercentApplied: 0,
        subtotal: subtotal2,
        tax: tax2,
        totalAmount: totalAmount2,
        status: MachineryBookingStatus.ACTIVE,
        notes: 'Pesticide spraying for 15 acres of paddy.',
        statusHistory: {
          create: [
            { status: MachineryBookingStatus.PENDING, note: 'Drone service requested' },
            { status: MachineryBookingStatus.CONFIRMED, note: 'Payment verified' },
            { status: MachineryBookingStatus.ACTIVE, note: 'Drone operator deployed on field' },
          ],
        },
        payment: {
          create: {
            userId: renter1.id,
            razorpayOrderId: 'order_demo_machinery_002',
            razorpayPaymentId: 'pay_demo_machinery_002',
            amount: totalAmount2,
            currency: 'INR',
            status: PaymentStatus.PAID,
            method: 'netbanking',
          },
        },
      },
    });
  }

  // Booking 3: Confirmed Combine Harvester booking by Vikram Patel
  const booking3Number = 'MB-2026-003';
  const startDate3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // in 3 days
  const endDate3 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // in 5 days
  const pricePerDay3 = 5500;
  const days3 = 2;
  const subtotal3 = pricePerDay3 * days3;
  const tax3 = subtotal3 * 0.05;
  const totalAmount3 = subtotal3 + tax3;

  const existingB3 = await prisma.machineryBooking.findUnique({ where: { bookingNumber: booking3Number } });
  if (!existingB3) {
    await prisma.machineryBooking.create({
      data: {
        bookingNumber: booking3Number,
        machineryId: m3.id,
        userId: renter2.id,
        quantity: 1,
        startDate: startDate3,
        endDate: endDate3,
        pricePerDaySnapshot: pricePerDay3,
        discountPercentApplied: 0,
        subtotal: subtotal3,
        tax: tax3,
        totalAmount: totalAmount3,
        status: MachineryBookingStatus.CONFIRMED,
        notes: 'Rice crop harvesting across 25 acres.',
        statusHistory: {
          create: [
            { status: MachineryBookingStatus.PENDING, note: 'Booking created' },
            { status: MachineryBookingStatus.CONFIRMED, note: 'Booking confirmed and scheduled for delivery.' },
          ],
        },
        payment: {
          create: {
            userId: renter2.id,
            razorpayOrderId: 'order_demo_machinery_003',
            razorpayPaymentId: 'pay_demo_machinery_003',
            amount: totalAmount3,
            currency: 'INR',
            status: PaymentStatus.PAID,
            method: 'upi',
          },
        },
      },
    });
  }

  console.log('\n--- DEMO ACCOUNTS CREATED ---');
  console.log('Admin Account:   admin@agrimarketplace.com / ChangeMe123!');
  console.log('Seller Account 1: seller.ramesh@agrimarketplace.com / Demo1234!');
  console.log('Seller Account 2: seller.kisan@agrimarketplace.com / Demo1234!');
  console.log('Farmer Account 1: farmer.ram@agrimarketplace.com / Demo1234!');
  console.log('Farmer Account 2: farmer.vikram@agrimarketplace.com / Demo1234!');
  console.log('-----------------------------\n');
  console.log('Seed complete with machinery listings, categories, demo users, and bookings!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
