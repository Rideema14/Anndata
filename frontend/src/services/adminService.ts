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
}
