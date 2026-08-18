import type { Product } from '@/types'

const baseReviews = [
  { id: 'rv1', author: 'Manoj Patel', rating: 5, comment: 'Good quality, delivered on time.', date: '2026-07-28T00:00:00.000Z' },
  { id: 'rv2', author: 'Kavita Sharma', rating: 4, comment: 'As described, will order again.', date: '2026-07-15T00:00:00.000Z' },
]

export const mockProductCatalog: Product[] = [
  {
    id: 'prd_1',
    name: 'Soybean Seeds — JS-9560',
    categorySlug: 'seeds',
    price: 1450,
    unit: '30 kg bag',
    sellerId: 'sel_1',
    sellerName: 'Madhya Bharat Agro',
    location: 'Katni',
    rating: 4.5,
    reviewCount: 128,
    stock: 42,
    description:
      'High-yield soybean variety suited to Madhya Pradesh soil and rainfall patterns. Certified seed with a strong germination rate, ideal for Kharif sowing.',
    specifications: [
      { label: 'Variety', value: 'JS-9560' },
      { label: 'Germination rate', value: '85%+' },
      { label: 'Sowing season', value: 'Kharif' },
      { label: 'Maturity', value: '95–100 days' },
    ],
    variants: ['5 kg', '10 kg', '30 kg'],
    reviews: baseReviews,
    createdAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'prd_2',
    name: 'NPK 19:19:19 Fertilizer',
    categorySlug: 'fertilizers',
    price: 1180,
    originalPrice: 1420,
    unit: '50 kg bag',
    sellerId: 'sel_2',
    sellerName: 'Krishi Seva Kendra',
    location: 'Jabalpur',
    rating: 4.3,
    reviewCount: 76,
    stock: 15,
    description:
      'Balanced NPK fertilizer for general crop nutrition. Suitable for wheat, soybean, and vegetable crops at the vegetative growth stage.',
    specifications: [
      { label: 'Composition', value: '19-19-19' },
      { label: 'Form', value: 'Granular' },
      { label: 'Application', value: 'Broadcast or drip' },
    ],
    reviews: baseReviews,
    createdAt: '2026-06-10T00:00:00.000Z',
  },
  {
    id: 'prd_3',
    name: 'Power Weeder 3.5 HP',
    categorySlug: 'equipment',
    price: 18500,
    unit: 'per unit',
    sellerId: 'sel_3',
    sellerName: 'Rewa Farm Tools',
    location: 'Rewa',
    rating: 4.6,
    reviewCount: 34,
    stock: 6,
    description:
      'Petrol-powered weeder ideal for inter-row weeding in vegetable and row crop fields. Lightweight frame, easy one-person operation.',
    specifications: [
      { label: 'Engine', value: '3.5 HP, 4-stroke' },
      { label: 'Fuel', value: 'Petrol' },
      { label: 'Weight', value: '38 kg' },
      { label: 'Warranty', value: '1 year' },
    ],
    reviews: baseReviews,
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  {
    id: 'prd_4',
    name: 'Mustard Seeds — Pusa Bold',
    categorySlug: 'seeds',
    price: 980,
    originalPrice: 1150,
    unit: '10 kg bag',
    sellerId: 'sel_4',
    sellerName: 'Seoni Beej Bhandar',
    location: 'Seoni',
    rating: 4.4,
    reviewCount: 51,
    stock: 60,
    description: 'Bold-seeded mustard variety with good oil content, well suited to Rabi sowing across Madhya Pradesh.',
    specifications: [
      { label: 'Variety', value: 'Pusa Bold' },
      { label: 'Oil content', value: '~40%' },
      { label: 'Sowing season', value: 'Rabi' },
    ],
    reviews: baseReviews,
    createdAt: '2026-06-18T00:00:00.000Z',
  },
  {
    id: 'prd_5',
    name: 'Mini Tractor Trailer',
    categorySlug: 'machinery',
    price: 62000,
    unit: 'per unit',
    sellerId: 'sel_5',
    sellerName: 'Indore Farm Equipment Co.',
    location: 'Indore',
    rating: 4.2,
    reviewCount: 19,
    stock: 3,
    description: 'Heavy-duty hydraulic tipping trailer compatible with mini tractors up to 25 HP. Ideal for produce and input transport.',
    specifications: [
      { label: 'Capacity', value: '1.5 tonne' },
      { label: 'Tipping', value: 'Hydraulic' },
      { label: 'Compatible HP', value: 'Up to 25 HP' },
    ],
    reviews: baseReviews,
    createdAt: '2026-05-02T00:00:00.000Z',
  },
  {
    id: 'prd_6',
    name: 'Galvanized Steel Roofing Sheets',
    categorySlug: 'building-materials',
    price: 420,
    unit: 'per sheet',
    sellerId: 'sel_6',
    sellerName: 'Bhopal Steel Traders',
    location: 'Bhopal',
    rating: 4.1,
    reviewCount: 22,
    stock: 500,
    description: 'Corrosion-resistant galvanized sheets for farm shed and storage roofing. Standard 8-foot length.',
    specifications: [
      { label: 'Length', value: '8 ft' },
      { label: 'Gauge', value: '26' },
      { label: 'Coating', value: 'Galvanized' },
    ],
    reviews: baseReviews,
    createdAt: '2026-04-28T00:00:00.000Z',
  },
  {
    id: 'prd_7',
    name: 'Cold-Pressed Mustard Oil',
    categorySlug: 'oil-products',
    price: 210,
    originalPrice: 260,
    unit: '1 litre',
    sellerId: 'sel_7',
    sellerName: 'Katni Oil Mill',
    location: 'Katni',
    rating: 4.7,
    reviewCount: 214,
    stock: 300,
    description: 'Traditional cold-pressed (kachi ghani) mustard oil, no chemical refining, packed fresh at the mill.',
    specifications: [
      { label: 'Extraction', value: 'Cold-pressed' },
      { label: 'Packaging', value: 'Sealed PET bottle' },
    ],
    reviews: baseReviews,
    createdAt: '2026-07-01T00:00:00.000Z',
  },
  {
    id: 'prd_8',
    name: 'Fresh Cow Milk — Daily Subscription',
    categorySlug: 'dairy',
    price: 60,
    unit: 'per litre',
    sellerId: 'sel_8',
    sellerName: 'Seoni Dairy Farm',
    location: 'Seoni',
    rating: 4.8,
    reviewCount: 302,
    stock: 999,
    description: 'Farm-fresh cow milk delivered daily. Subscribe for a fixed morning delivery slot.',
    specifications: [
      { label: 'Fat content', value: '~4.2%' },
      { label: 'Delivery', value: 'Daily, morning' },
    ],
    reviews: baseReviews,
    createdAt: '2026-07-10T00:00:00.000Z',
  },
  {
    id: 'prd_9',
    name: 'Wheat Seeds — HD-3086',
    categorySlug: 'seeds',
    price: 1650,
    unit: '40 kg bag',
    sellerId: 'sel_1',
    sellerName: 'Madhya Bharat Agro',
    location: 'Katni',
    rating: 4.6,
    reviewCount: 187,
    stock: 80,
    description: 'Disease-resistant, high-yielding wheat variety recommended for irrigated Rabi conditions in central India.',
    specifications: [
      { label: 'Variety', value: 'HD-3086' },
      { label: 'Sowing season', value: 'Rabi' },
      { label: 'Maturity', value: '140–145 days' },
    ],
    reviews: baseReviews,
    createdAt: '2026-06-25T00:00:00.000Z',
  },
  {
    id: 'prd_10',
    name: 'Drip Irrigation Starter Kit — 1 Acre',
    categorySlug: 'equipment',
    price: 24500,
    unit: 'per kit',
    sellerId: 'sel_9',
    sellerName: 'AquaFarm Systems',
    location: 'Indore',
    rating: 4.5,
    reviewCount: 41,
    stock: 12,
    description: 'Complete drip irrigation kit for 1 acre, including laterals, drippers, filters and a control valve.',
    specifications: [
      { label: 'Coverage', value: '1 acre' },
      { label: 'Includes', value: 'Filter, laterals, drippers, valve' },
    ],
    reviews: baseReviews,
    createdAt: '2026-05-15T00:00:00.000Z',
  },
  {
    id: 'prd_11',
    name: 'Vermicompost — Organic Manure',
    categorySlug: 'fertilizers',
    price: 380,
    originalPrice: 460,
    unit: '25 kg bag',
    sellerId: 'sel_2',
    sellerName: 'Krishi Seva Kendra',
    location: 'Jabalpur',
    rating: 4.4,
    reviewCount: 63,
    stock: 90,
    description: 'Fully composted organic vermicompost, improves soil structure and water retention over time.',
    specifications: [
      { label: 'Type', value: 'Organic' },
      { label: 'NPK (approx.)', value: '1.5-0.5-1.2' },
    ],
    reviews: baseReviews,
    createdAt: '2026-06-05T00:00:00.000Z',
  },
  {
    id: 'prd_12',
    name: 'Diesel Water Pump — 5 HP',
    categorySlug: 'machinery',
    price: 32500,
    unit: 'per unit',
    sellerId: 'sel_5',
    sellerName: 'Indore Farm Equipment Co.',
    location: 'Indore',
    rating: 4.3,
    reviewCount: 28,
    stock: 9,
    description: 'Reliable 5 HP diesel water pump for field irrigation, self-priming with a robust cast-iron body.',
    specifications: [
      { label: 'Power', value: '5 HP' },
      { label: 'Fuel', value: 'Diesel' },
      { label: 'Priming', value: 'Self-priming' },
    ],
    reviews: baseReviews,
    createdAt: '2026-05-28T00:00:00.000Z',
  },
]

export function getProductById(id: string): Product | undefined {
  return mockProductCatalog.find((p) => p.id === id)
}

export function getProductsByCategory(slug: string): Product[] {
  return mockProductCatalog.filter((p) => p.categorySlug === slug)
}

/** Products with an originalPrice > price are "Top Deals" — sorted by biggest discount first. */
export function getTopDeals(): Product[] {
  return mockProductCatalog
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .sort((a, b) => (b.originalPrice! - b.price) / b.originalPrice! - (a.originalPrice! - a.price) / a.originalPrice!)
}

export function getDiscountPercent(product: Product): number | null {
  if (!product.originalPrice || product.originalPrice <= product.price) return null
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
}

/**
 * "Nearby" products — same city as the given location first, then the rest.
 * All mock listings sit in Madhya Pradesh, so this approximates real
 * geo-distance sorting until the backend provides coordinates.
 */
export function getNearbyProducts(userLocation: string, limit = 8): Product[] {
  const city = userLocation.split(',')[0]?.trim().toLowerCase()
  const sameCity = mockProductCatalog.filter((p) => p.location.toLowerCase() === city)
  const rest = mockProductCatalog.filter((p) => p.location.toLowerCase() !== city)
  return [...sameCity, ...rest].slice(0, limit)
}
