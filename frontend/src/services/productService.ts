import { api } from './api'
import type { Product, ProductReview } from '@/types'

interface BackendImage {
  id: string
  url: string
  isPrimary: boolean
}
interface BackendVariant {
  id: string
  name: string
  price: number | string
  stock: number
}
interface BackendProductSummary {
  id: string
  slug: string
  name: string
  description?: string | null
  price: number | string
  discountPrice?: number | string | null
  stock: number
  unit: string
  specifications?: Record<string, unknown> | null
  avgRating: number
  reviewCount: number
  sellerId: string
  createdAt: string
  isActive?: boolean
  images: BackendImage[]
  category: { id: string; name: string; slug: string }
  subCategory?: { id: string; name: string; slug: string } | null
}
interface BackendProductDetail extends BackendProductSummary {
  variants: BackendVariant[]
  seller: { id: string; name: string; profileImage?: string | null }
  isWishlisted: boolean
}
interface BackendReview {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  user: { id: string; name: string }
}

export interface PaginationMeta {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

export interface ProductQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  subCategory?: string
  minPrice?: number
  maxPrice?: number
  sellerId?: string
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'
}

export interface ProductCreateInput {
  categoryId: string
  subCategoryId?: string
  name: string
  description?: string
  brand?: string
  price: number
  discountPrice?: number
  stock: number
  unit: string
  specifications?: Record<string, unknown>
  latitude?: number
  longitude?: number
}

function mapSummary(p: BackendProductSummary): Product {
  const price = Number(p.discountPrice ?? p.price)
  const original = p.discountPrice ? Number(p.price) : undefined
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categorySlug: p.category?.slug ?? '',
    price,
    originalPrice: original,
    unit: p.unit,
    sellerId: p.sellerId,
    sellerName: '',
    location: p.category?.name ?? '',
    rating: p.avgRating,
    reviewCount: p.reviewCount,
    stock: p.stock,
    description: p.description ?? '',
    specifications: Object.entries(p.specifications ?? {}).map(([label, value]) => ({
      label,
      value: String(value),
    })),
    reviews: [],
    createdAt: p.createdAt,
    images: p.images?.map((img) => img.url) ?? [],
    isActive: p.isActive,
  }
}

function mapDetail(p: BackendProductDetail): Product {
  return {
    ...mapSummary(p),
    sellerName: p.seller?.name ?? '',
    isWishlisted: p.isWishlisted,
    variants: p.variants?.map((v) => v.name),
    variantOptions: p.variants?.map((v) => ({ id: v.id, name: v.name, price: Number(v.price), stock: v.stock })),
  }
}

function mapReview(r: BackendReview): ProductReview {
  return {
    id: r.id,
    author: r.user?.name ?? 'Anonymous',
    rating: r.rating,
    comment: r.comment ?? '',
    date: r.createdAt,
  }
}

export const productService = {
  async list(query: ProductQuery = {}): Promise<{ items: Product[]; meta: PaginationMeta }> {
    const res = await api.get<{ data: BackendProductSummary[]; meta: { pagination: PaginationMeta } }>('/products', {
      params: query,
    })
    return { items: res.data.data.map(mapSummary), meta: res.data.meta.pagination }
  },

  async getBySlug(slug: string): Promise<Product> {
    const res = await api.get<{ data: BackendProductDetail }>(`/products/${encodeURIComponent(slug)}`)
    return mapDetail(res.data.data)
  },

  /**
   * The backend's top-deals/nearby endpoints run a raw SQL query for speed and
   * only return a lean field set (no category, images, or seller) — not the
   * full product shape `mapSummary` expects. We map those fields directly
   * and fetch the full record lazily (via getBySlug) only if a page needs it.
   */
  async topDeals(limit = 12): Promise<Product[]> {
    interface RawDeal {
      id: string
      name: string
      slug: string
      price: number | string
      discountPrice?: number | string | null
      stock: number
      unit: string
      avgRating: number
      reviewCount: number
    }
    const res = await api.get<{ data: RawDeal[] }>('/products/top-deals', { params: { limit } })
    return res.data.data.map((p) => ({
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
      createdAt: '',
    }))
  },

  async nearby(lat: number, lng: number, radiusKm = 25, limit = 20): Promise<Product[]> {
    interface RawNearby {
      id: string
      name: string
      slug: string
      price: number | string
      discountPrice?: number | string | null
      stock: number
      unit: string
      avgRating: number
      reviewCount: number
      distanceKm: number
    }
    const res = await api.get<{ data: RawNearby[] }>('/products/nearby', { params: { lat, lng, radiusKm, limit } })
    return res.data.data.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      categorySlug: '',
      price: Number(p.discountPrice ?? p.price),
      originalPrice: p.discountPrice ? Number(p.price) : undefined,
      unit: p.unit,
      sellerId: '',
      sellerName: '',
      location: `${p.distanceKm.toFixed(1)} km away`,
      rating: p.avgRating,
      reviewCount: p.reviewCount,
      stock: p.stock,
      description: '',
      specifications: [],
      reviews: [],
      createdAt: '',
    }))
  },

  async create(input: ProductCreateInput): Promise<Product> {
    const res = await api.post<{ data: BackendProductDetail }>('/products', input)
    return mapDetail(res.data.data)
  },

  async update(id: string, input: Partial<ProductCreateInput> & { isActive?: boolean }): Promise<Product> {
    const res = await api.patch<{ data: BackendProductDetail }>(`/products/${id}`, input)
    return mapDetail(res.data.data)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/products/${id}`)
  },

  async uploadImages(productId: string, files: File[]): Promise<void> {
    const form = new FormData()
    files.forEach((file) => form.append('images', file))
    await api.post(`/products/${productId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  async listReviews(productId: string): Promise<ProductReview[]> {
    const res = await api.get<{ data: BackendReview[] }>(`/products/${productId}/reviews`)
    return res.data.data.map(mapReview)
  },

  async addReview(productId: string, rating: number, comment?: string): Promise<ProductReview> {
    const res = await api.post<{ data: BackendReview }>(`/products/${productId}/reviews`, { rating, comment })
    return mapReview(res.data.data)
  },
}