import type { ProductSummary } from '@/types'

/* =========================================================
   PRODUCT CATALOG
========================================================= */

export const mockProductCatalog: ProductSummary[] = [
  {
    id: 'prd_1',
    name: 'Soybean Seeds — JS-9560',
    category: 'Seeds',
    categorySlug: 'seeds',
    price: 1450,
    unit: '30 kg bag',
    sellerName: 'Madhya Bharat Agro',
    location: 'Katni',
    rating: 4.5,
    reviewCount: 28,
    stock: 120,
    description:
      'High-quality soybean seeds suitable for Madhya Pradesh farming conditions.',
    image:
      'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=80',
    variants: ['10 kg bag', '20 kg bag', '30 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Soybean' },
      { label: 'Variety', value: 'JS-9560' },
      { label: 'Pack Size', value: '30 kg' },
    ],
    reviews: [],
  },

  {
    id: 'prd_2',
    name: 'NPK 19:19:19 Fertilizer',
    category: 'Fertilizers',
    categorySlug: 'fertilizers',
    price: 1180,
    unit: '50 kg bag',
    sellerName: 'Krishi Seva Kendra',
    location: 'Jabalpur',
    rating: 4.3,
    reviewCount: 19,
    stock: 85,
    description:
      'Balanced NPK fertilizer suitable for improving crop growth and nutrient availability.',
    image:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80',
    variants: ['25 kg bag', '50 kg bag'],
    specifications: [
      { label: 'Type', value: 'NPK Fertilizer' },
      { label: 'NPK Ratio', value: '19:19:19' },
      { label: 'Pack Size', value: '50 kg' },
    ],
    reviews: [],
  },

  {
    id: 'prd_3',
    name: 'Power Weeder 3.5 HP',
    category: 'Farming Equipment',
    categorySlug: 'farming-equipment',
    price: 18500,
    unit: 'per unit',
    sellerName: 'Rewa Farm Tools',
    location: 'Rewa',
    rating: 4.6,
    reviewCount: 34,
    stock: 12,
    description:
      'Compact power weeder designed for efficient field preparation and weed removal.',
    image:
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=80',
    variants: ['3.5 HP'],
    specifications: [
      { label: 'Engine', value: '3.5 HP' },
      { label: 'Type', value: 'Power Weeder' },
      { label: 'Use', value: 'Weeding and soil preparation' },
    ],
    reviews: [],
  },

  {
    id: 'prd_4',
    name: 'Mustard Seeds — Pusa Bold',
    category: 'Seeds',
    categorySlug: 'seeds',
    price: 980,
    unit: '10 kg bag',
    sellerName: 'Seoni Beej Bhandar',
    location: 'Seoni',
    rating: 4.4,
    reviewCount: 22,
    stock: 95,
    description:
      'Quality Pusa Bold mustard seeds selected for reliable crop performance.',
    image:
      'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=900&q=80',
    variants: ['5 kg bag', '10 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Mustard' },
      { label: 'Variety', value: 'Pusa Bold' },
      { label: 'Pack Size', value: '10 kg' },
    ],
    reviews: [],
  },

  {
    id: 'prd_5',
    name: 'Organic Vermicompost',
    category: 'Fertilizers',
    categorySlug: 'fertilizers',
    price: 650,
    unit: '25 kg bag',
    sellerName: 'Narmada Organic Farms',
    location: 'Jabalpur',
    rating: 4.7,
    reviewCount: 41,
    stock: 150,
    description:
      'Organic vermicompost made from natural materials to improve soil structure and fertility.',
    image:
      'https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&w=900&q=80',
    variants: ['10 kg bag', '25 kg bag'],
    specifications: [
      { label: 'Type', value: 'Organic Vermicompost' },
      { label: 'Pack Size', value: '25 kg' },
      { label: 'Suitable For', value: 'All crops' },
    ],
    reviews: [],
  },

  {
    id: 'prd_6',
    name: 'Drip Irrigation Kit',
    category: 'Irrigation',
    categorySlug: 'irrigation',
    price: 4200,
    unit: 'per kit',
    sellerName: 'Jabalpur Irrigation Solutions',
    location: 'Jabalpur',
    rating: 4.5,
    reviewCount: 31,
    stock: 25,
    description:
      'Water-efficient drip irrigation kit suitable for small and medium-sized farms.',
    image:
      'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=900&q=80',
    variants: ['Small Farm Kit', 'Medium Farm Kit'],
    specifications: [
      { label: 'Type', value: 'Drip Irrigation' },
      { label: 'Water Saving', value: 'High' },
      { label: 'Suitable For', value: 'Field and horticulture crops' },
    ],
    reviews: [],
  },

  {
    id: 'prd_7',
    name: 'Hybrid Maize Seeds',
    category: 'Seeds',
    categorySlug: 'seeds',
    price: 1250,
    unit: '10 kg bag',
    sellerName: 'Vindhya Agro Seeds',
    location: 'Rewa',
    rating: 4.4,
    reviewCount: 25,
    stock: 110,
    description:
      'Hybrid maize seeds selected for good crop establishment and yield potential.',
    image:
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=900&q=80',
    variants: ['5 kg bag', '10 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Maize' },
      { label: 'Type', value: 'Hybrid' },
      { label: 'Pack Size', value: '10 kg' },
    ],
    reviews: [],
  },

  {
    id: 'prd_8',
    name: 'Battery Sprayer 16L',
    category: 'Farming Equipment',
    categorySlug: 'farming-equipment',
    price: 2800,
    unit: 'per unit',
    sellerName: 'Kisan Equipment Hub',
    location: 'Katni',
    rating: 4.6,
    reviewCount: 37,
    stock: 30,
    description:
      'Portable battery-operated sprayer suitable for pesticides, fertilizers and crop care.',
    image:
      'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80',
    variants: ['12L', '16L', '20L'],
    specifications: [
      { label: 'Capacity', value: '16 Litres' },
      { label: 'Power', value: 'Battery operated' },
      { label: 'Type', value: 'Agricultural Sprayer' },
    ],
    reviews: [],
  },

  {
    id: 'prd_9',
    name: 'Urea Fertilizer',
    category: 'Fertilizers',
    categorySlug: 'fertilizers',
    price: 590,
    unit: '45 kg bag',
    sellerName: 'Krishi Seva Kendra',
    location: 'Jabalpur',
    rating: 4.2,
    reviewCount: 18,
    stock: 200,
    description:
      'Nitrogen-rich urea fertilizer for supporting healthy crop growth.',
    image:
      'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=900&q=80',
    variants: ['45 kg bag'],
    specifications: [
      { label: 'Type', value: 'Urea' },
      { label: 'Pack Size', value: '45 kg' },
      { label: 'Nutrient', value: 'Nitrogen' },
    ],
    reviews: [],
  },

  {
    id: 'prd_10',
    name: 'Pusa Mustard Seeds',
    category: 'Seeds',
    categorySlug: 'seeds',
    price: 1050,
    unit: '10 kg bag',
    sellerName: 'Seoni Beej Bhandar',
    location: 'Seoni',
    rating: 4.5,
    reviewCount: 29,
    stock: 75,
    description:
      'Reliable Pusa mustard seed variety suitable for winter cultivation.',
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80',
    variants: ['5 kg bag', '10 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Mustard' },
      { label: 'Type', value: 'Pusa Variety' },
      { label: 'Pack Size', value: '10 kg' },
    ],
    reviews: [],
  },
]

/* =========================================================
   GET PRODUCT BY ID
========================================================= */

export function getProductById(
  id: string,
): ProductSummary | undefined {
  return mockProductCatalog.find(
    (product) => product.id === id,
  )
}

/* =========================================================
   GET ALL PRODUCTS
========================================================= */

export function getAllProducts(): ProductSummary[] {
  return mockProductCatalog
}

/* =========================================================
   GET PRODUCTS BY CATEGORY
========================================================= */

export function getProductsByCategory(
  category: string,
): ProductSummary[] {
  const normalizedCategory = category
    .trim()
    .toLowerCase()

  return mockProductCatalog.filter(
    (product) =>
      product.category.toLowerCase() === normalizedCategory ||
      product.categorySlug.toLowerCase() === normalizedCategory,
  )
}

/* =========================================================
   DISCOUNT
========================================================= */

export function getDiscountPercent(
  product: ProductSummary,
): number {
  // Products with no originalPrice have no discount.
  // Kept at 0 so existing components don't break.
  return 0
}

/* =========================================================
   TOP DEALS
========================================================= */

export function getTopDeals(): ProductSummary[] {
  return [...mockProductCatalog]
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating
      }

      return b.reviewCount - a.reviewCount
    })
    .slice(0, 6)
}

/* =========================================================
   NEARBY PRODUCTS
========================================================= */

export function getNearbyProducts(
  location: string,
): ProductSummary[] {
  if (!location.trim()) {
    return mockProductCatalog.slice(0, 6)
  }

  const searchLocation = location
    .split(',')[0]
    .trim()
    .toLowerCase()

  const nearby = mockProductCatalog.filter(
    (product) =>
      product.location.toLowerCase() === searchLocation,
  )

  // If no exact location matches, return products
  // instead of returning an empty rail.
  if (nearby.length === 0) {
    return mockProductCatalog.slice(0, 6)
  }

  return nearby.slice(0, 6)
}

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default mockProductCatalog