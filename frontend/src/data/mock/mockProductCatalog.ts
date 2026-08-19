import type { ProductSummary } from '@/types'

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
    reviewCount: 24,
    stock: 120,
    description:
      'High-quality JS-9560 soybean seeds suitable for Madhya Pradesh farming conditions. Good yield potential and reliable crop performance.',
    image:
      'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=900&q=85',
    variants: ['10 kg bag', '20 kg bag', '30 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Soybean' },
      { label: 'Variety', value: 'JS-9560' },
      { label: 'Pack size', value: '30 kg' },
      { label: 'Suitable region', value: 'Madhya Pradesh' },
    ],
    reviews: [
      {
        id: 'rev_1',
        author: 'Rajesh Patel',
        rating: 5,
        comment: 'Good quality seeds and healthy germination.',
        date: ''
      },
      {
        id: 'rev_2',
        author: 'Amit Kumar',
        rating: 4,
        comment: 'Good product for the price.',
        date: ''
      },
    ],
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
    reviewCount: 18,
    stock: 85,
    description:
      'Balanced NPK fertilizer containing nitrogen, phosphorus and potassium for healthy crop growth and improved plant development.',
    image:
      'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=85',
    variants: ['10 kg bag', '25 kg bag', '50 kg bag'],
    specifications: [
      { label: 'Type', value: 'NPK Fertilizer' },
      { label: 'Composition', value: '19:19:19' },
      { label: 'Pack size', value: '50 kg' },
      { label: 'Application', value: 'Field crops' },
    ],
    reviews: [
      {
        id: 'rev_3',
        author: 'Suresh Verma',
        rating: 4,
        comment: 'Works well for my crops.',
        date: ''
      },
      {
        id: 'rev_4',
        author: 'Mohan Singh',
        rating: 5,
        comment: 'Good quality fertilizer.',
        date: ''
      },
    ],
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
    reviewCount: 31,
    stock: 12,
    description:
      'Compact 3.5 HP power weeder designed for efficient soil preparation, intercultural operations and weed management.',
    image:
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=900&q=85',
    variants: ['3.5 HP'],
    specifications: [
      { label: 'Type', value: 'Power Weeder' },
      { label: 'Power', value: '3.5 HP' },
      { label: 'Fuel', value: 'Petrol' },
      { label: 'Usage', value: 'Weeding & soil preparation' },
    ],
    reviews: [
      {
        id: 'rev_5',
        author: 'Vijay Yadav',
        rating: 5,
        comment: 'Very useful machine for my farm.',
        date: ''
      },
      {
        id: 'rev_6',
        author: 'Deepak Patel',
        rating: 4,
        comment: 'Good performance and easy to operate.',
        date: ''
      },
    ],
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
    reviewCount: 21,
    stock: 95,
    description:
      'Pusa Bold mustard seeds selected for strong crop growth and good oilseed production.',
    image:
      'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?auto=format&fit=crop&w=900&q=85',
    variants: ['5 kg bag', '10 kg bag', '20 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Mustard' },
      { label: 'Variety', value: 'Pusa Bold' },
      { label: 'Pack size', value: '10 kg' },
      { label: 'Season', value: 'Rabi' },
    ],
    reviews: [
      {
        id: 'rev_7',
        author: 'Ramesh Sharma',
        rating: 5,
        comment: 'Very good germination.',
        date: ''
      },
    ],
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
    reviewCount: 42,
    stock: 150,
    description:
      'Natural organic vermicompost made from decomposed organic material to improve soil health and fertility.',
    image:
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=85',
    variants: ['10 kg bag', '25 kg bag', '50 kg bag'],
    specifications: [
      { label: 'Type', value: 'Organic manure' },
      { label: 'Pack size', value: '25 kg' },
      { label: 'Application', value: 'Soil enrichment' },
      { label: 'Organic', value: 'Yes' },
    ],
    reviews: [
      {
        id: 'rev_8',
        author: 'Anil Tiwari',
        rating: 5,
        comment: 'Excellent compost for vegetables.',
        date: ''
      },
    ],
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
    reviewCount: 16,
    stock: 30,
    description:
      'Water-efficient drip irrigation kit designed to provide controlled water delivery directly to plant roots.',
    image:
      'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=900&q=85',
    variants: ['Small farm kit', 'Medium farm kit'],
    specifications: [
      { label: 'Type', value: 'Drip irrigation' },
      { label: 'Water saving', value: 'High' },
      { label: 'Usage', value: 'Field & horticulture' },
      { label: 'Installation', value: 'Easy installation' },
    ],
    reviews: [
      {
        id: 'rev_9',
        author: 'Harish Patel',
        rating: 5,
        comment: 'Very useful for reducing water usage.',
        date: ''
      },
    ],
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
    reviewCount: 19,
    stock: 75,
    description:
      'Hybrid maize seeds selected for strong plant growth and reliable field performance.',
    image:
      'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=900&q=85',
    variants: ['5 kg bag', '10 kg bag', '20 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Maize' },
      { label: 'Type', value: 'Hybrid' },
      { label: 'Pack size', value: '10 kg' },
      { label: 'Season', value: 'Kharif' },
    ],
    reviews: [
      {
        id: 'rev_10',
        author: 'Ravi Kushwaha',
        rating: 4,
        comment: 'Good seeds with healthy plants.',
        date: ''
      },
    ],
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
    reviewCount: 27,
    stock: 40,
    description:
      'Rechargeable 16-litre battery sprayer designed for convenient and efficient crop spraying.',
    image:
      'https://images.unsplash.com/photo-1598512752271-33f913a5af13?auto=format&fit=crop&w=900&q=85',
    variants: ['12L', '16L', '20L'],
    specifications: [
      { label: 'Type', value: 'Battery sprayer' },
      { label: 'Capacity', value: '16 litres' },
      { label: 'Power', value: 'Rechargeable battery' },
      { label: 'Usage', value: 'Crop spraying' },
    ],
    reviews: [
      {
        id: 'rev_11',
        author: 'Manoj Jain',
        rating: 5,
        comment: 'Battery lasts well and spraying is easy.',
        date: ''
      },
    ],
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
    reviewCount: 14,
    stock: 100,
    description:
      'Nitrogen-rich urea fertilizer suitable for improving vegetative growth and crop development.',
    image:
      'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=900&q=85',
    variants: ['45 kg bag'],
    specifications: [
      { label: 'Type', value: 'Nitrogen fertilizer' },
      { label: 'Pack size', value: '45 kg' },
      { label: 'Application', value: 'Field crops' },
      { label: 'N content', value: '46%' },
    ],
    reviews: [
      {
        id: 'rev_12',
        author: 'Dinesh Patel',
        rating: 4,
        comment: 'Good quality and properly packed.',
        date: ''
      },
    ],
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
    reviewCount: 23,
    stock: 80,
    description:
      'Quality Pusa mustard seeds suitable for Rabi cultivation with good crop establishment.',
    image:
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=85',
    variants: ['5 kg bag', '10 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Mustard' },
      { label: 'Type', value: 'Pusa variety' },
      { label: 'Pack size', value: '10 kg' },
      { label: 'Season', value: 'Rabi' },
    ],
    reviews: [
      {
        id: 'rev_13',
        author: 'Sunil Verma',
        rating: 5,
        comment: 'Good quality mustard seeds.',
        date: ''
      },
    ],
  },
]

// =====================================================
// GET PRODUCT BY ID
// =====================================================

export function getProductById(
  id: string,
): ProductSummary | undefined {
  return mockProductCatalog.find(
    (product) => product.id === id,
  )
}

// =====================================================
// GET ALL PRODUCTS
// =====================================================

export function getAllProducts(): ProductSummary[] {
  return mockProductCatalog
}

// =====================================================
// GET PRODUCTS BY CATEGORY
// =====================================================

export function getProductsByCategory(
  category: string,
): ProductSummary[] {
  return mockProductCatalog.filter(
    (product) =>
      product.category.toLowerCase() === category.toLowerCase() ||
      product.categorySlug?.toLowerCase() === category.toLowerCase(),
  )
}

// =====================================================
// DISCOUNT
// =====================================================

export function getDiscountPercent(
  product: ProductSummary,
): number {
  if (product.price >= 15000) return 10
  if (product.price >= 5000) return 7
  if (product.price >= 1000) return 5

  return 3
}