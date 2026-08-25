import { api } from './api'
import type { PaginationMeta } from './productService'

/* =========================================================
   BACKEND SHAPES
========================================================= */

interface BackendMachineryImage {
  id: string
  url: string
  isPrimary: boolean
  sortOrder: number
}
interface BackendDiscountTier {
  id: string
  minQuantity: number
  discountPercent: number | string
}
interface BackendMachineryCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  isActive?: boolean
}
interface BackendMachinerySummary {
  id: string
  sellerId: string
  categoryId: string
  name: string
  slug: string
  description?: string | null
  brand?: string | null
  model?: string | null
  totalUnits: number
  pricePerDay: number | string
  bufferDays: number
  specifications?: Record<string, unknown> | null
  latitude?: number | null
  longitude?: number | null
  isActive: boolean
  avgRating: number
  reviewCount: number
  viewCount: number
  createdAt: string
  images: BackendMachineryImage[]
  category: { id: string; name: string; slug: string }
  discountTiers: BackendDiscountTier[]
}
interface BackendMachineryDetail extends BackendMachinerySummary {
  seller: { id: string; name: string; profileImage?: string | null }
}
interface BackendMachineryReview {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  user: { id: string; name: string; profileImage?: string | null }
}

type BackendBookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

interface BackendMachineryBooking {
  id: string
  bookingNumber: string
  machineryId: string
  userId: string
  addressId?: string | null
  quantity: number
  startDate: string
  endDate: string
  pricePerDaySnapshot: number | string
  discountPercentApplied: number | string
  subtotal: number | string
  tax: number | string
  totalAmount: number | string
  status: BackendBookingStatus
  notes?: string | null
  cancelReason?: string | null
  createdAt: string
  updatedAt: string
  machinery?: { id: string; name: string; slug: string; sellerId: string; bufferDays?: number }
  user?: { id: string; name: string; phone?: string | null; profileImage?: string | null }
  payment?: { status: string; method?: string | null; razorpayOrderId?: string } | null
}

interface BackendPaymentCreateResult {
  paymentId: string
  razorpayOrderId: string
  amount: number
  currency: string
  keyId: string
  bookingId: string
  bookingNumber: string
}

/* =========================================================
   PUBLIC SHAPES (what the UI consumes)
========================================================= */

export interface MachineryCategory {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
}

export interface MachineryListing {
  id: string
  slug: string
  name: string
  ownerId: string
  ownerName: string
  location: string
  pricePerDay: number
  totalUnits: number
  bufferDays: number
  available: boolean
  rating: number
  reviewCount: number
  description: string
  brand?: string
  model?: string
  categoryId: string
  categoryName: string
  images: string[]
  specifications: Record<string, unknown>
  discountTiers: { id: string; minQuantity: number; discountPercent: number }[]
}

export interface MachineryReview {
  id: string
  author: string
  rating: number
  comment: string
  date: string
}

export interface MachineryQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sellerId?: string
  startDate?: string
  endDate?: string
  quantity?: number
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular'
}

export interface MachineryCreateInput {
  categoryId: string
  name: string
  description?: string
  brand?: string
  model?: string
  totalUnits?: number
  pricePerDay: number
  bufferDays?: number
  specifications?: Record<string, unknown>
  latitude?: number
  longitude?: number
}

export type MachineryBookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'

export interface MachineryBooking {
  id: string
  bookingNumber: string
  machineryId: string
  machineryName: string
  machinerySlug: string
  machinerySellerId: string
  renterName: string
  renterPhone?: string
  startDate: string
  endDate: string
  quantity: number
  totalPrice: number
  status: MachineryBookingStatus
  paymentStatus?: string
  notes?: string
}

const STATUS_MAP: Record<BackendBookingStatus, MachineryBookingStatus> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

const BACKEND_STATUS_MAP: Record<MachineryBookingStatus, BackendBookingStatus> = {
  pending: 'PENDING',
  confirmed: 'CONFIRMED',
  active: 'ACTIVE',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
}

export interface MachineryDashboardStats {
  activeListings: number
  totalListings: number
  bookingsToFulfill: number
  activeRentalsToday: number
  totalRevenue: number
  revenueLast30Days: number
}

/* =========================================================
   MAPPERS
========================================================= */

function mapCategory(c: BackendMachineryCategory): MachineryCategory {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? undefined,
    imageUrl: c.imageUrl ?? undefined,
  }
}

function mapListing(m: BackendMachinerySummary): MachineryListing {
  return {
    id: m.id,
    slug: m.slug,
    name: m.name,
    ownerId: m.sellerId,
    ownerName: '',
    location: '',
    pricePerDay: Number(m.pricePerDay),
    totalUnits: m.totalUnits,
    bufferDays: m.bufferDays,
    available: m.isActive,
    rating: m.avgRating,
    reviewCount: m.reviewCount,
    description: m.description ?? '',
    brand: m.brand ?? undefined,
    model: m.model ?? undefined,
    categoryId: m.category?.id ?? m.categoryId,
    categoryName: m.category?.name ?? '',
    images: m.images?.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => img.url) ?? [],
    specifications: m.specifications ?? {},
    discountTiers: m.discountTiers?.map((t) => ({ id: t.id, minQuantity: t.minQuantity, discountPercent: Number(t.discountPercent) })) ?? [],
  }
}

function mapListingDetail(m: BackendMachineryDetail): MachineryListing {
  return { ...mapListing(m), ownerName: m.seller?.name ?? '' }
}

function mapReview(r: BackendMachineryReview): MachineryReview {
  return {
    id: r.id,
    author: r.user?.name ?? 'Anonymous',
    rating: r.rating,
    comment: r.comment ?? '',
    date: r.createdAt,
  }
}

function mapBooking(b: BackendMachineryBooking): MachineryBooking {
  return {
    id: b.id,
    bookingNumber: b.bookingNumber,
    machineryId: b.machineryId,
    machineryName: b.machinery?.name ?? 'Machinery',
    machinerySlug: b.machinery?.slug ?? '',
    machinerySellerId: b.machinery?.sellerId ?? '',
    renterName: b.user?.name ?? 'Farmer',
    renterPhone: b.user?.phone ?? undefined,
    startDate: b.startDate,
    endDate: b.endDate,
    quantity: b.quantity,
    totalPrice: Number(b.totalAmount),
    status: STATUS_MAP[b.status],
    paymentStatus: b.payment?.status,
    notes: b.notes ?? undefined,
  }
}

/* =========================================================
   SERVICE
========================================================= */

export const machineryService = {
  async listCategories(): Promise<MachineryCategory[]> {
    const res = await api.get<{ data: BackendMachineryCategory[] }>('/machinery/categories')
    return res.data.data.map(mapCategory)
  },

  async list(query: MachineryQuery = {}): Promise<{ items: MachineryListing[]; meta: PaginationMeta }> {
    const res = await api.get<{ data: BackendMachinerySummary[]; meta: { pagination: PaginationMeta } }>('/machinery', {
      params: query,
    })
    return { items: res.data.data.map(mapListing), meta: res.data.meta.pagination }
  },

  async getBySlug(slug: string): Promise<MachineryListing> {
    const res = await api.get<{ data: BackendMachineryDetail }>(`/machinery/${encodeURIComponent(slug)}`)
    return mapListingDetail(res.data.data)
  },

  async getAvailability(
    machineryId: string,
    startDate: string,
    endDate: string,
    quantity = 1,
  ): Promise<{ totalUnits: number; bookedQuantity: number; availableQuantity: number; isAvailable: boolean }> {
    const res = await api.get<{ data: { totalUnits: number; bookedQuantity: number; availableQuantity: number; isAvailable: boolean } }>(
      `/machinery/${machineryId}/availability`,
      { params: { startDate, endDate, quantity } },
    )
    return res.data.data
  },

  async create(input: MachineryCreateInput): Promise<MachineryListing> {
    const res = await api.post<{ data: BackendMachineryDetail }>('/machinery', input)
    return mapListingDetail(res.data.data)
  },

  async update(id: string, input: Partial<MachineryCreateInput> & { isActive?: boolean }): Promise<MachineryListing> {
    const res = await api.patch<{ data: BackendMachineryDetail }>(`/machinery/${id}`, input)
    return mapListingDetail(res.data.data)
  },

  async setActive(id: string, isActive: boolean): Promise<MachineryListing> {
    const res = await api.patch<{ data: BackendMachineryDetail }>(`/machinery/${id}`, { isActive })
    return mapListingDetail(res.data.data)
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/machinery/${id}`)
  },

  async removeImage(machineryId: string, imageId: string): Promise<void> {
    await api.delete(`/machinery/${machineryId}/images/${imageId}`)
  },

  async addDiscountTier(machineryId: string, minQuantity: number, discountPercent: number): Promise<void> {
    await api.post(`/machinery/${machineryId}/discount-tiers`, { minQuantity, discountPercent })
  },

  async updateDiscountTier(machineryId: string, tierId: string, input: { minQuantity?: number; discountPercent?: number }): Promise<void> {
    await api.patch(`/machinery/${machineryId}/discount-tiers/${tierId}`, input)
  },

  async removeDiscountTier(machineryId: string, tierId: string): Promise<void> {
    await api.delete(`/machinery/${machineryId}/discount-tiers/${tierId}`)
  },

  /** Seller/admin action on a booking made for their machinery: confirm, start, complete, or reject. */
  async updateBookingStatus(id: string, status: MachineryBookingStatus, note?: string): Promise<MachineryBooking> {
    const res = await api.patch<{ data: BackendMachineryBooking }>(`/machinery/bookings/${id}/status`, {
      status: BACKEND_STATUS_MAP[status],
      note,
    })
    return mapBooking(res.data.data)
  },

  async getDashboard(): Promise<MachineryDashboardStats> {
    const res = await api.get<{ data: MachineryDashboardStats }>('/machinery/analytics/dashboard')
    return res.data.data
  },

  async uploadImages(machineryId: string, files: File[]): Promise<void> {
    const form = new FormData()
    files.forEach((file) => form.append('images', file))
    await api.post(`/machinery/${machineryId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  async listReviews(machineryId: string): Promise<MachineryReview[]> {
    const res = await api.get<{ data: BackendMachineryReview[] }>(`/machinery/${machineryId}/reviews`)
    return res.data.data.map(mapReview)
  },

  async addReview(machineryId: string, rating: number, comment?: string): Promise<MachineryReview> {
    const res = await api.post<{ data: BackendMachineryReview }>(`/machinery/${machineryId}/reviews`, { rating, comment })
    return mapReview(res.data.data)
  },

  /** Creates the booking AND its Razorpay order in one call, mirroring orderService.checkout. */
  async createBooking(input: {
    machineryId: string
    startDate: string
    endDate: string
    quantity?: number
    addressId?: string
    notes?: string
  }): Promise<{ booking: MachineryBooking; razorpayOrderId?: string; amount?: number }> {
    const res = await api.post<{ data: { booking: BackendMachineryBooking; payment: BackendPaymentCreateResult } }>(
      '/machinery/bookings',
      input,
    )
    const { booking, payment } = res.data.data
    return { booking: mapBooking(booking), razorpayOrderId: payment?.razorpayOrderId, amount: payment ? payment.amount / 100 : undefined }
  },

  async listBookings(params: { page?: number; limit?: number; status?: BackendBookingStatus; scope?: 'mine' | 'selling' } = {}): Promise<{
    items: MachineryBooking[]
    meta: PaginationMeta
  }> {
    const res = await api.get<{ data: BackendMachineryBooking[]; meta: { pagination: PaginationMeta } }>('/machinery/bookings', {
      params,
    })
    return { items: res.data.data.map(mapBooking), meta: res.data.meta.pagination }
  },

  async getBooking(id: string): Promise<MachineryBooking> {
    const res = await api.get<{ data: BackendMachineryBooking }>(`/machinery/bookings/${id}`)
    return mapBooking(res.data.data)
  },

  async cancelBooking(id: string, reason?: string): Promise<MachineryBooking> {
    const res = await api.post<{ data: BackendMachineryBooking }>(`/machinery/bookings/${id}/cancel`, { reason })
    return mapBooking(res.data.data)
  },
}
