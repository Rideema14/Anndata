import { api } from './api'
import type { Order, OrderItem, OrderStatus, OrderSummary, ProductReview } from '@/types'
import type { PaginationMeta } from './productService'

/* =========================================================================
 * Catalog
 * ====================================================================== */

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
interface BackendSeedCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
}
interface BackendSeedSummary {
  id: string
  slug: string
  name: string
  description?: string | null
  brand?: string | null
  variety?: string | null
  sowingSeason?: string | null
  germinationRatePercent?: number | null
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
  seedCategory: { id: string; name: string; slug: string }
}
interface BackendSeedDetail extends BackendSeedSummary {
  variants: BackendVariant[]
  seller: { id: string; name: string; profileImage?: string | null }
  isWishlisted: boolean
}
interface BackendSeedReview {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  user: { id: string; name: string }
}

export interface Seed {
  id: string
  slug: string
  name: string
  categorySlug: string
  categoryName: string
  brand?: string
  variety?: string
  sowingSeason?: string
  germinationRatePercent?: number
  price: number
  originalPrice?: number
  unit: string
  sellerId: string
  sellerName: string
  rating: number
  reviewCount: number
  stock: number
  description: string
  specifications: { label: string; value: string }[]
  createdAt: string
  images: string[]
  isActive?: boolean
  isWishlisted?: boolean
  variants?: { id: string; name: string; price: number; stock: number }[]
}

export interface SeedQuery {
  page?: number
  limit?: number
  search?: string
  seedCategory?: string
  sowingSeason?: 'Kharif' | 'Rabi' | 'Zaid'
  minPrice?: number
  maxPrice?: number
  sellerId?: string
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'
}

function mapSeedSummary(s: BackendSeedSummary): Seed {
  const price = Number(s.discountPrice ?? s.price)
  const original = s.discountPrice ? Number(s.price) : undefined
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    categorySlug: s.seedCategory?.slug ?? '',
    categoryName: s.seedCategory?.name ?? '',
    brand: s.brand ?? undefined,
    variety: s.variety ?? undefined,
    sowingSeason: s.sowingSeason ?? undefined,
    germinationRatePercent: s.germinationRatePercent ?? undefined,
    price,
    originalPrice: original,
    unit: s.unit,
    sellerId: s.sellerId,
    sellerName: '',
    rating: s.avgRating,
    reviewCount: s.reviewCount,
    stock: s.stock,
    description: s.description ?? '',
    specifications: Object.entries(s.specifications ?? {}).map(([label, value]) => ({
      label,
      value: String(value),
    })),
    createdAt: s.createdAt,
    images: s.images?.map((img) => img.url) ?? [],
    isActive: s.isActive,
  }
}

function mapSeedDetail(s: BackendSeedDetail): Seed {
  return {
    ...mapSeedSummary(s),
    sellerName: s.seller?.name ?? '',
    isWishlisted: s.isWishlisted,
    variants: s.variants?.map((v) => ({ id: v.id, name: v.name, price: Number(v.price), stock: v.stock })),
  }
}

function mapSeedReview(r: BackendSeedReview): ProductReview {
  return {
    id: r.id,
    author: r.user?.name ?? 'Anonymous',
    rating: r.rating,
    comment: r.comment ?? '',
    date: r.createdAt,
  }
}

export const seedService = {
  async list(query: SeedQuery = {}): Promise<{ items: Seed[]; meta: PaginationMeta }> {
    const res = await api.get<{ data: BackendSeedSummary[]; meta: { pagination: PaginationMeta } }>('/seeds', {
      params: query,
    })
    return { items: res.data.data.map(mapSeedSummary), meta: res.data.meta.pagination }
  },

  async getBySlug(slug: string): Promise<Seed> {
    const res = await api.get<{ data: BackendSeedDetail }>(`/seeds/${encodeURIComponent(slug)}`)
    return mapSeedDetail(res.data.data)
  },

  async listCategories(): Promise<BackendSeedCategory[]> {
    const res = await api.get<{ data: BackendSeedCategory[] }>('/seeds/categories')
    return res.data.data
  },

  async listReviews(seedId: string): Promise<ProductReview[]> {
    const res = await api.get<{ data: BackendSeedReview[] }>(`/seeds/${seedId}/reviews`)
    return res.data.data.map(mapSeedReview)
  },

  async addReview(seedId: string, rating: number, comment?: string): Promise<ProductReview> {
    const res = await api.post<{ data: BackendSeedReview }>(`/seeds/${seedId}/reviews`, { rating, comment })
    return mapSeedReview(res.data.data)
  },
}

/* =========================================================================
 * Cart
 * ====================================================================== */

interface BackendSeedCartItem {
  id: string
  seedId: string
  variantId?: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
  seed: {
    id: string
    name: string
    slug: string
    price: number | string
    discountPrice?: number | string | null
    stock: number
    isActive: boolean
    images: { url: string }[]
  }
  variant?: { id: string; name: string } | null
}
interface BackendSeedCart {
  id: string
  items: BackendSeedCartItem[]
  subtotal: number
}

export interface SeedCartLine {
  seedId: string
  quantity: number
  itemId: string
  variantId?: string
  variantName?: string
  unitPrice: number
  lineTotal: number
  seed: {
    id: string
    name: string
    slug: string
    price: number
    discountPrice?: number
    imageUrl?: string
    stock: number
  }
}
export interface SeedCart {
  lines: SeedCartLine[]
  subtotal: number
}

function mapSeedCartItem(item: BackendSeedCartItem): SeedCartLine {
  return {
    seedId: item.seedId,
    quantity: item.quantity,
    itemId: item.id,
    variantId: item.variantId ?? undefined,
    variantName: item.variant?.name,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    seed: {
      id: item.seed.id,
      name: item.seed.name,
      slug: item.seed.slug,
      price: Number(item.seed.discountPrice ?? item.seed.price),
      discountPrice: item.seed.discountPrice ? Number(item.seed.discountPrice) : undefined,
      imageUrl: item.seed.images?.[0]?.url,
      stock: item.seed.stock,
    },
  }
}
function mapSeedCart(c: BackendSeedCart): SeedCart {
  return { lines: c.items.map(mapSeedCartItem), subtotal: c.subtotal }
}

export const seedCartService = {
  async get(): Promise<SeedCart> {
    const res = await api.get<{ data: BackendSeedCart }>('/seeds/cart')
    return mapSeedCart(res.data.data)
  },

  async addItem(seedId: string, quantity = 1, variantId?: string): Promise<SeedCart> {
    const res = await api.post<{ data: BackendSeedCart }>('/seeds/cart/items', { seedId, variantId, quantity })
    return mapSeedCart(res.data.data)
  },

  async updateQuantity(itemId: string, quantity: number): Promise<SeedCart> {
    const res = await api.patch<{ data: BackendSeedCart }>(`/seeds/cart/items/${itemId}`, { quantity })
    return mapSeedCart(res.data.data)
  },

  async removeItem(itemId: string): Promise<SeedCart> {
    const res = await api.delete<{ data: BackendSeedCart }>(`/seeds/cart/items/${itemId}`)
    return mapSeedCart(res.data.data)
  },

  async clear(): Promise<SeedCart> {
    const res = await api.delete<{ data: BackendSeedCart }>('/seeds/cart')
    return mapSeedCart(res.data.data)
  },
}

/* =========================================================================
 * Orders
 * ====================================================================== */

type BackendStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'

const STATUS_MAP: Record<BackendStatus, OrderStatus> = {
  PENDING: 'placed',
  CONFIRMED: 'confirmed',
  PROCESSING: 'packed',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
}

interface BackendSeedOrderItem {
  id: string
  seedId: string
  seedName: string
  quantity: number
  unitPrice: number | string
  totalPrice: number | string
}
interface BackendAddress {
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
}
interface BackendSeedPayment {
  id: string
  razorpayOrderId: string
  amount: number | string
  status: 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
}
interface BackendSeedOrder {
  id: string
  orderNumber: string
  status: BackendStatus
  subtotal: number | string
  shippingFee: number | string
  tax: number | string
  totalAmount: number | string
  createdAt: string
  updatedAt: string
  items: BackendSeedOrderItem[]
  address: BackendAddress
  payment?: BackendSeedPayment | null
  user?: { id: string; name: string }
}

function formatAddress(a: BackendAddress): string {
  return [a.addressLine1, a.addressLine2, a.city, a.state].filter(Boolean).join(', ') + ` – ${a.postalCode}`
}
function mapItem(i: BackendSeedOrderItem): OrderItem {
  return { productId: i.seedId, name: i.seedName, quantity: i.quantity, price: Number(i.unitPrice) }
}
function mapOrder(o: BackendSeedOrder): Order {
  return {
    id: o.orderNumber,
    items: o.items.map(mapItem),
    total: Number(o.totalAmount),
    status: STATUS_MAP[o.status],
    placedAt: o.createdAt,
    updatedAt: o.updatedAt,
    address: formatAddress(o.address),
    paymentMethod: o.payment ? 'Razorpay' : 'Pending',
  }
}
function mapSummary(o: BackendSeedOrder): OrderSummary {
  const label = o.items.map((i) => `${i.seedName} × ${i.quantity}`).join(', ')
  const itemsSubtotal = o.items.reduce((sum, i) => sum + Number(i.totalPrice), 0)
  return {
    id: o.orderNumber,
    itemsLabel: label,
    total: Number(o.totalAmount),
    itemsSubtotal,
    status: STATUS_MAP[o.status],
    placedAt: o.createdAt,
    updatedAt: o.updatedAt,
    buyerName: o.user?.name,
  }
}

/** Internal id (uuid) lookup — the frontend routes/displays by orderNumber, but PATCH/cancel need the real id. */
const idByOrderNumber = new Map<string, string>()

export const seedOrderService = {
  async checkout(addressId: string, notes?: string): Promise<{ order: Order; razorpayOrderId?: string; amount?: number }> {
    const res = await api.post<{ data: { order: BackendSeedOrder; payment: BackendSeedPayment } }>(
      '/seeds/orders/checkout',
      { addressId, notes },
    )
    const { order, payment } = res.data.data
    idByOrderNumber.set(order.orderNumber, order.id)
    return { order: mapOrder(order), razorpayOrderId: payment?.razorpayOrderId, amount: Number(payment?.amount) }
  },

  async list(params: { page?: number; limit?: number; status?: BackendStatus; scope?: 'mine' | 'selling' } = {}): Promise<{
    items: OrderSummary[]
    meta: PaginationMeta
  }> {
    const res = await api.get<{ data: BackendSeedOrder[]; meta: { pagination: PaginationMeta } }>('/seeds/orders', {
      params,
    })
    res.data.data.forEach((o) => idByOrderNumber.set(o.orderNumber, o.id))
    return { items: res.data.data.map(mapSummary), meta: res.data.meta.pagination }
  },

  async getOne(idOrNumber: string): Promise<Order> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.get<{ data: BackendSeedOrder }>(`/seeds/orders/${realId}`)
    idByOrderNumber.set(res.data.data.orderNumber, res.data.data.id)
    return mapOrder(res.data.data)
  },

  async cancel(idOrNumber: string, reason?: string): Promise<Order> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.post<{ data: BackendSeedOrder }>(`/seeds/orders/${realId}/cancel`, { reason })
    return mapOrder(res.data.data)
  },
}
