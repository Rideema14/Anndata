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

// --- All-orders management (requirement #11/#12/#13) & settlement (requirement #18-#25) ---

export type AdminOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'DELIVERY_FAILED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'DISPUTED'

export type AdminSettlementStatus =
  | 'NOT_ELIGIBLE'
  | 'PENDING_REVIEW'
  | 'SELLER_PAYOUT_PENDING'
  | 'SELLER_PAID'
  | 'BUYER_REFUND_PENDING'
  | 'BUYER_REFUNDED'

export type AdminPaymentStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface AdminOrderListItem {
  id: string
  orderNumber: string
  status: AdminOrderStatus
  settlementStatus: AdminSettlementStatus
  totalAmount: number | string
  createdAt: string
  user: { id: string; name: string; email: string }
  shipment?: { carrierCode: string; carrierName?: string | null; awb: string; sellerId: string } | null
  payment?: { status: AdminPaymentStatus; method?: string | null } | null
  disputes: { id: string; status: string }[]
  sellers: { id: string; name: string }[]
}

export interface AdminOrderDetailItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number | string
  totalPrice: number | string
  product?: {
    id: string
    name: string
    sellerId: string
    seller?: { id: string; name: string; email: string; phone?: string | null }
    images?: { url: string }[]
  } | null
}

export interface AdminOrderDetailOrder {
  id: string
  orderNumber: string
  status: AdminOrderStatus
  settlementStatus: AdminSettlementStatus
  subtotal: number | string
  shippingFee: number | string
  tax: number | string
  totalAmount: number | string
  createdAt: string
  updatedAt: string
  cancelReason?: string | null
  user: { id: string; name: string; email: string; phone?: string | null }
  address: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string | null
    city: string
    state: string
    postalCode: string
  }
  items: AdminOrderDetailItem[]
  payment?: { id: string; razorpayOrderId: string; amount: number | string; status: AdminPaymentStatus; method?: string | null } | null
  shipment?: {
    carrierCode: string
    carrierName?: string | null
    awb: string
    shipmentDate?: string | null
    note?: string | null
    submittedAt: string
    seller?: { id: string; name: string; email: string; phone?: string | null } | null
    trackingUrl?: string | null
    trackingUrlIsDirect?: boolean
  } | null
  disputes: { id: string; reason: string; details?: string | null; status: AdminDisputeStatus; adminNote?: string | null; createdAt: string }[]
  statusHistory: { status: AdminOrderStatus; note?: string | null; changedAt: string }[]
}

export interface AdminSettlementRecord {
  id: string
  orderId: string
  status: AdminSettlementStatus
  decision?: 'REFUND_BUYER' | 'PAY_SELLER' | null
  sellerId?: string | null
  seller?: { id: string; name: string; email: string } | null
  buyerPaidTotal: number | string
  productAmount: number | string
  platformAmount: number | string
  amount: number | string
  reason?: string | null
  isAutomatic: boolean
  isCurrent: boolean
  paymentReference?: string | null
  resolvedById?: string | null
  resolvedByRole?: string | null
  resolvedAt: string
  createdAt: string
}

export interface AdminOrderDetail {
  order: AdminOrderDetailOrder
  settlementHistory: AdminSettlementRecord[]
  auditLog: AdminAuditLogEntry[]
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

export type AdminDisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'

export interface AdminDispute {
  id: string
  reason: string
  details?: string | null
  status: AdminDisputeStatus
  adminNote?: string | null
  createdAt: string
  resolvedAt?: string | null
  order: { id: string; orderNumber: string; status: string; settlementStatus?: string }
  user: { id: string; name: string; email: string }
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

  // --- All-orders management (requirement #11/#12/#13) -------------------

  async listAllOrders(
    params: {
      page?: number
      limit?: number
      status?: AdminOrderStatus
      settlementStatus?: AdminSettlementStatus
      paymentStatus?: AdminPaymentStatus
      carrierCode?: string
      search?: string
    } = {},
  ): Promise<{ items: AdminOrderListItem[]; totalItems: number }> {
    const res = await api.get<{ data: AdminOrderListItem[]; meta: { pagination: { totalItems: number } } }>('/admin/orders', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  async getOrderDetail(idOrNumber: string): Promise<AdminOrderDetail> {
    const res = await api.get<{ data: AdminOrderDetail }>(`/admin/orders/${idOrNumber}`)
    return res.data.data
  },

  /** Admin-only manual status override — hits the same endpoint as the buyer-facing order service, but works directly in backend status strings so nothing gets lost round-tripping through the frontend's lowercase OrderStatus. */
  async updateOrderStatus(idOrNumber: string, status: AdminOrderStatus, note?: string): Promise<AdminOrderDetailOrder> {
    const res = await api.patch<{ data: AdminOrderDetailOrder }>(`/orders/${idOrNumber}/status`, { status, note })
    return res.data.data
  },

  // --- Settlement decisions (requirement #18-#25) -------------------------

  async decideSettlement(
    idOrNumber: string,
    input: { decision: 'REFUND_BUYER' | 'PAY_SELLER'; sellerId?: string; reason: string },
  ): Promise<AdminSettlementRecord> {
    const res = await api.post<{ data: AdminSettlementRecord }>(`/admin/orders/${idOrNumber}/settlement`, input)
    return res.data.data
  },

  async confirmBuyerRefund(idOrNumber: string, input: { reference?: string } = {}): Promise<AdminSettlementRecord> {
    const res = await api.post<{ data: AdminSettlementRecord }>(`/admin/orders/${idOrNumber}/settlement/refund-confirm`, input)
    return res.data.data
  },

  async correctSettlement(idOrNumber: string, input: { reason: string }): Promise<AdminSettlementRecord> {
    const res = await api.post<{ data: AdminSettlementRecord }>(`/admin/orders/${idOrNumber}/settlement/correct`, input)
    return res.data.data
  },

  // --- Dispute review (requirement #9) --------------------------------------

  async listDisputes(params: { page?: number; limit?: number; status?: AdminDisputeStatus } = {}): Promise<{ items: AdminDispute[]; totalItems: number }> {
    const res = await api.get<{ data: AdminDispute[]; meta: { pagination: { totalItems: number } } }>('/admin/disputes', { params })
    return { items: res.data.data, totalItems: res.data.meta.pagination.totalItems }
  },

  async reviewDispute(disputeId: string, status: 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED', adminNote?: string): Promise<AdminDispute> {
    const res = await api.patch<{ data: AdminDispute }>(`/admin/disputes/${disputeId}/review`, { status, adminNote })
    return res.data.data
  },
}
