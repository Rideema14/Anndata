import { api } from './api'
import type { Product } from '@/types'

interface BackendWishlistEntry {
  id: string
  productId: string
  createdAt: string
  product: {
    id: string
    slug: string
    name: string
    price: number | string
    discountPrice?: number | string | null
    unit: string
    stock: number
    avgRating: number
    reviewCount: number
    images: { url: string }[]
  }
}

function mapEntry(e: BackendWishlistEntry): Product {
  const p = e.product
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categorySlug: '',
    price: Number(p.discountPrice ?? p.price),
    originalPrice: p.discountPrice ? Number(p.price) : undefined,
    unit: p.unit,
    sellerId: '',
    sellerName: '',
    location: '',
    rating: p.avgRating,
    reviewCount: p.reviewCount,
    stock: p.stock,
    description: '',
    specifications: [],
    reviews: [],
    createdAt: e.createdAt,
    images: p.images?.map((i) => i.url) ?? [],
  }
}

export const wishlistService = {
  async list(): Promise<Product[]> {
    const res = await api.get<{ data: BackendWishlistEntry[] }>('/wishlist')
    return res.data.data.map(mapEntry)
  },

  async add(productId: string): Promise<void> {
    await api.post(`/wishlist/${productId}`)
  },

  async remove(productId: string): Promise<void> {
    await api.delete(`/wishlist/${productId}`)
  },
}
