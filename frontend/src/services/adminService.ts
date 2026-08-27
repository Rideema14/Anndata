import { api } from './api'

export interface PlatformAnalytics {
  totalUsers: number
  totalBuyers: number
  totalSellers: number
  totalAdmins: number
  totalOrders: number
  totalProducts: number
  gmv: number
  monthlyGmv: { month: string; gmv: number; orderCount: number }[]
  orderStatusBreakdown: { status: string; count: number }[]
}

export interface AdminUser {
  id: string
  name: string
  email: string
  phone?: string | null
  role: 'BUYER' | 'SELLER' | 'ADMIN'
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
}

export interface AdminReview {
  id: string
  rating: number
  comment?: string | null
  isApproved: boolean
  createdAt: string
  user: { id: string; name: string }
  product: { id: string; name: string; slug: string; sellerId: string }
}

export interface AdminProduct {
  id: string
  name: string
  price: number | string
  category: { id: string; name: string }
  seller: { id: string; name: string; email: string }
  images: { url: string }[]
  isActive: boolean
}

export interface SellerBalance {
  id: string
  name: string
  email: string
  phone?: string | null
  profileImage?: string | null
  businessName?: string | null
  verificationStatus?: string | null
  bankAccountHolder?: string | null
  bankAccountNumber?: string | null
  bankIfscCode?: string | null
  bankName?: string | null
  totalEarned: number
  totalPaidOut: number
  balance: number
}

export interface Payout {
  id: string
  sellerId: string
  amount: number | string
  method: 'BANK_TRANSFER' | 'UPI' | 'OTHER'
  status: 'PAID' | 'REVERSED'
  reference?: string | null
  note?: string | null
  createdAt: string
  seller?: { id: string; name: string; email: string; sellerProfile?: { businessName: string | null } | null }
  paidBy?: { id: string; name: string }
}

export const adminService = {
  async getAnalytics(months = 6): Promise<PlatformAnalytics> {
    const res = await api.get<{ data: PlatformAnalytics }>('/admin/analytics', { params: { months } })
    return res.data.data
  },

  async listUsers(params: { page?: number; limit?: number; search?: string } = {}): Promise<{ items: AdminUser[]; totalItems: number }> {
    const res = await api.get<{ data: AdminUser[]; meta: { pagination: { totalItems: number } } }>('/admin/users', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  async listReviews(params: { page?: number; limit?: number } = {}): Promise<{ items: AdminReview[]; totalItems: number }> {
    const res = await api.get<{ data: AdminReview[]; meta: { pagination: { totalItems: number } } }>('/admin/reviews', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  async listProducts(params: { page?: number; limit?: number; search?: string } = {}): Promise<{ items: AdminProduct[]; totalItems: number }> {
    const res = await api.get<{ data: AdminProduct[]; meta: { pagination: { totalItems: number } } }>('/admin/products', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  /** Reviews are nested under their product in the write API — moderation reads them flat via /admin/reviews above. */
  async removeReview(productId: string, reviewId: string): Promise<void> {
    await api.delete(`/products/${productId}/reviews/${reviewId}`)
  },

  async getSellerBalances(params: { page?: number; limit?: number; search?: string } = {}): Promise<{ items: SellerBalance[]; totalItems: number }> {
    const res = await api.get<{ data: SellerBalance[]; meta: { pagination: { totalItems: number } } }>('/admin/sellers/balances', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  /** Fetched fresh right before the "Pay out" modal opens so figures can't be stale. */
  async getSellerBalance(sellerId: string): Promise<SellerBalance> {
    const res = await api.get<{ data: SellerBalance }>(`/admin/sellers/${sellerId}/balance`)
    return res.data.data
  },

  async createPayout(
    sellerId: string,
    input: { amount: number; method: 'BANK_TRANSFER' | 'UPI' | 'OTHER'; reference?: string; note?: string },
  ): Promise<Payout> {
    const res = await api.post<{ data: Payout }>(`/admin/sellers/${sellerId}/payouts`, input)
    return res.data.data
  },

  async listPayouts(params: { page?: number; limit?: number; sellerId?: string; status?: 'PAID' | 'REVERSED' } = {}): Promise<{
    items: Payout[]
    totalItems: number
  }> {
    const res = await api.get<{ data: Payout[]; meta: { pagination: { totalItems: number } } }>('/admin/payouts', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  async reversePayout(payoutId: string): Promise<Payout> {
    const res = await api.patch<{ data: Payout }>(`/admin/payouts/${payoutId}/reverse`)
    return res.data.data
  },
}
