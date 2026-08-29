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
<<<<<<< HEAD
  businessName?: string | null
=======
  phone?: string | null
  profileImage?: string | null
  businessName?: string | null
  verificationStatus?: string | null
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d
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
<<<<<<< HEAD
=======
  sellerId: string
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d
  amount: number | string
  method: 'BANK_TRANSFER' | 'UPI' | 'OTHER'
  status: 'PAID' | 'REVERSED'
  reference?: string | null
  note?: string | null
  createdAt: string
<<<<<<< HEAD
  seller?: { id: string; name: string; email: string; sellerProfile?: { businessName?: string | null } | null }
=======
  seller?: { id: string; name: string; email: string; sellerProfile?: { businessName: string | null } | null }
  paidBy?: { id: string; name: string }
}

// --- Shipment management (requirement #10) & disputes (requirement #9) ---

export type AdminShipmentStatus = 'AWB_SUBMITTED' | 'AWB_VERIFIED' | 'PICKUP_CONFIRMED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERY_FAILED' | 'RETURNED' | 'EXCEPTION'

export interface AdminShipmentListItem {
  id: string
  carrierCode: string
  carrierName?: string | null
  awb: string
  status: AdminShipmentStatus
  verified: boolean
  pickupConfirmedAt?: string | null
  deliveredAt?: string | null
  lastSyncedAt?: string | null
  flaggedForReview: boolean
  riskFlags: string[]
  riskNote?: string | null
  updatedAt: string
  order: {
    id: string
    orderNumber: string
    status: string
    user: { id: string; name: string; email: string }
    items: { productName: string }[]
    disputes: { id: string; status: string }[]
  }
  seller?: { id: string; name: string; email: string } | null
  events: { id: string; status: string; description: string; eventTime: string }[]
}

export interface AdminAuditLogEntry {
  id: string
  orderId: string
  shipmentId?: string | null
  action: string
  actorId?: string | null
  actorRole?: string | null
  source: string
  previousState?: string | null
  newState?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
}

export interface AdminShipmentDetail {
  order: unknown
  auditLog: AdminAuditLogEntry[]
}

export type AdminDisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'

export interface AdminDispute {
  id: string
  reason: string
  details?: string | null
  status: AdminDisputeStatus
  adminNote?: string | null
  createdAt: string
  resolvedAt?: string | null
  order: { id: string; orderNumber: string; status: string }
  user: { id: string; name: string; email: string }
}

export interface AdminRiskSignal {
  id: string
  orderId: string
  action: string
  createdAt: string
  metadata?: { reason?: string; count?: number; windowDays?: number } | null
  actor?: { id: string; name: string; email: string } | null
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d
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

<<<<<<< HEAD
  async getSellerBalances(params: { limit?: number; search?: string } = {}): Promise<{ items: SellerBalance[]; totalItems: number }> {
    const res = await api.get<{ data: SellerBalance[]; meta: { pagination: { totalItems: number } } }>('/admin/payouts/balances', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  /** Fresh, single-seller balance — used to refresh the pay-out modal's figures right before recording a payout. */
  async getSellerBalance(sellerId: string): Promise<SellerBalance> {
    const res = await api.get<{ data: SellerBalance }>(`/admin/payouts/balances/${sellerId}`)
    return res.data.data
  },

  async listPayouts(params: { limit?: number } = {}): Promise<{ items: Payout[]; totalItems: number }> {
    const res = await api.get<{ data: Payout[]; meta: { pagination: { totalItems: number } } }>('/admin/payouts', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  async createPayout(
    sellerId: string,
    body: { amount: number; method: 'BANK_TRANSFER' | 'UPI' | 'OTHER'; reference?: string; note?: string },
  ): Promise<Payout> {
    const res = await api.post<{ data: Payout }>(`/admin/payouts/${sellerId}`, body)
    return res.data.data
  },

  async reversePayout(payoutId: string): Promise<Payout> {
    const res = await api.post<{ data: Payout }>(`/admin/payouts/${payoutId}/reverse`)
=======
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

  // --- Shipment management (requirement #10) ------------------------------

  async listShipments(
    params: { page?: number; limit?: number; status?: AdminShipmentStatus; flagged?: boolean; disputed?: boolean; search?: string } = {},
  ): Promise<{ items: AdminShipmentListItem[]; totalItems: number }> {
    const res = await api.get<{ data: AdminShipmentListItem[]; meta: { pagination: { totalItems: number } } }>('/admin/shipments', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  async getShipmentDetail(orderIdOrNumber: string): Promise<AdminShipmentDetail> {
    const res = await api.get<{ data: AdminShipmentDetail }>(`/admin/shipments/${orderIdOrNumber}`)
    return res.data.data
  },

  /** The ONLY shipment write available to admins — courier-derived status/events/timestamps are never editable. */
  async flagShipment(orderIdOrNumber: string, note: string): Promise<AdminShipmentListItem> {
    const res = await api.post<{ data: AdminShipmentListItem }>(`/admin/shipments/${orderIdOrNumber}/flag`, { note })
    return res.data.data
  },

  async listRiskSignals(): Promise<AdminRiskSignal[]> {
    const res = await api.get<{ data: AdminRiskSignal[] }>('/admin/shipments/risk-signals')
    return res.data.data
  },

  // --- Dispute review (requirement #9) --------------------------------------

  async listDisputes(params: { page?: number; limit?: number; status?: AdminDisputeStatus } = {}): Promise<{ items: AdminDispute[]; totalItems: number }> {
    const res = await api.get<{ data: AdminDispute[]; meta: { pagination: { totalItems: number } } }>('/admin/disputes', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  async reviewDispute(disputeId: string, status: 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED', adminNote?: string): Promise<AdminDispute> {
    const res = await api.patch<{ data: AdminDispute }>(`/admin/disputes/${disputeId}/review`, { status, adminNote })
>>>>>>> 441adbb369c21ed2d2f22dd3759d4188bd49908d
    return res.data.data
  },
}
