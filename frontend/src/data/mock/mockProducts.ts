import type { ProductSummary } from '@/types'

export const mockRecommendedProducts: ProductSummary[] = [
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
      'High-quality soybean seeds suitable for Madhya Pradesh farming conditions.',
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=90',
    variants: ['10 kg bag', '20 kg bag', '30 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Soybean' },
      { label: 'Variety', value: 'JS-9560' },
      { label: 'Pack Size', value: '30 kg' },
      { label: 'Seller', value: 'Madhya Bharat Agro' },
    ],
    reviews: [
      {
        id: 'review_1',
        author: 'Rajesh Kumar',
        rating: 5,
        comment: 'Good quality seeds and very good germination.',
        date: ''
      },
      {
        id: 'review_2',
        author: 'Amit Patel',
        rating: 4,
        comment: 'Good product for soybean cultivation.',
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
      'Balanced NPK fertilizer designed to provide essential nutrients for healthy crop growth.',
    image:
      'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=1200&q=90',
    variants: ['25 kg bag', '50 kg bag'],
    specifications: [
      { label: 'Type', value: 'NPK Fertilizer' },
      { label: 'Formula', value: '19:19:19' },
      { label: 'Pack Size', value: '50 kg' },
      { label: 'Application', value: 'Agriculture' },
    ],
    reviews: [
      {
        id: 'review_3',
        author: 'Suresh Verma',
        rating: 4,
        comment: 'Works well for my crops.',
        date: ''
      },
      {
        id: 'review_4',
        author: 'Manoj Singh',
        rating: 5,
        comment: 'Good fertilizer and properly packed.',
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
      'Compact and powerful agricultural weeder designed for efficient field preparation and weed removal.',
    image:
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=90',
    variants: ['3.5 HP', '5 HP'],
    specifications: [
      { label: 'Equipment', value: 'Power Weeder' },
      { label: 'Engine', value: '3.5 HP' },
      { label: 'Fuel', value: 'Petrol' },
      { label: 'Use', value: 'Weeding & Soil Preparation' },
    ],
    reviews: [
      {
        id: 'review_5',
        author: 'Deepak Yadav',
        rating: 5,
        comment: 'Powerful machine and easy to operate.',
        date: ''
      },
      {
        id: 'review_6',
        author: 'Vijay Sharma',
        rating: 4,
        comment: 'Very useful for small farms.',
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
      'Quality Pusa Bold mustard seeds suitable for commercial and farm cultivation.',
    image:
      'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=1200&q=90',
    variants: ['5 kg bag', '10 kg bag', '20 kg bag'],
    specifications: [
      { label: 'Crop', value: 'Mustard' },
      { label: 'Variety', value: 'Pusa Bold' },
      { label: 'Pack Size', value: '10 kg' },
      { label: 'Seller', value: 'Seoni Beej Bhandar' },
    ],
    reviews: [
      {
        id: 'review_7',
        author: 'Ramesh Patel',
        rating: 5,
        comment: 'Good quality mustard seeds.',
        date: ''
      },
      {
        id: 'review_8',
        author: 'Kailash Singh',
        rating: 4,
        comment: 'Good germination and packaging.',
        date: ''
      },
    ],
  },
]