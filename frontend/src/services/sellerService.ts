import { api } from './api'

export type SellerVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface SellerApplyInput {
  businessName: string
  gstNumber?: string
  bankAccountNumber?: string
  bankIfsc?: string
  bankAccountName?: string
}

export interface SellerProfile {
  id: string
  userId: string
  businessName: string
  verificationStatus: SellerVerificationStatus
  verificationNote?: string | null
  createdAt: string
}

export interface SellerDashboard {
  activeListings: number
  totalListings: number
  ordersToFulfill: number
  totalRevenue: number
  revenueLast30Days: number
}

export interface SalesTrendPoint {
  date: string
  revenue: number
  orderCount: number
}
export interface TopProduct {
  id: string
  name: string
  slug: string
  unitsSold: number
  revenue: number
}
export interface StatusBreakdownRow {
  status: string
  count: number
}
export interface SellerAnalytics {
  salesTrend: SalesTrendPoint[]
  topProducts: TopProduct[]
  statusBreakdown: StatusBreakdownRow[]
}

export interface SellerReview {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  user: { id: string; name: string; profileImage?: string | null }
  product: { id: string; name: string; slug: string; images: { url: string }[] }
}

interface BackendSellerApplication {
  id: string
  businessName: string
  verificationStatus: SellerVerificationStatus
  createdAt: string
  user: { id: string; name: string; email: string; phone?: string | null }
}

export interface SellerApplication {
  id: string
  businessName: string
  status: SellerVerificationStatus
  createdAt: string
  applicantName: string
  applicantEmail: string
}

function mapApplication(a: BackendSellerApplication): SellerApplication {
  return {
    id: a.id,
    businessName: a.businessName,
    status: a.verificationStatus,
    createdAt: a.createdAt,
    applicantName: a.user.name,
    applicantEmail: a.user.email,
  }
}

export const sellerService = {
  /** Current user's own application/profile. Throws (404) if they've never applied. */
  async getMyProfile(): Promise<SellerProfile> {
    const res = await api.get<{ data: SellerProfile }>('/sellers/me')
    return res.data.data
  },

  async apply(input: SellerApplyInput): Promise<SellerProfile> {
    const res = await api.post<{ data: SellerProfile }>('/sellers/apply', input)
    return res.data.data
  },

  async getDashboard(): Promise<SellerDashboard> {
    const res = await api.get<{ data: SellerDashboard }>('/sellers/dashboard')
    return res.data.data
  },

  async getAnalytics(days = 180, topProductsLimit = 8): Promise<SellerAnalytics> {
    const res = await api.get<{ data: SellerAnalytics }>('/sellers/analytics', { params: { days, topProductsLimit } })
    return res.data.data
  },

  async getReviews(params: { page?: number; limit?: number } = {}): Promise<{ items: SellerReview[]; meta: { totalItems: number } }> {
    const res = await api.get<{ data: SellerReview[]; meta: { pagination: { totalItems: number } } }>('/sellers/reviews', { params })
    return { items: res.data.data, meta: { totalItems: res.data.meta.pagination.totalItems } }
  },

  // --- Admin: verification console ---------------------------------------

  async listApplications(status?: SellerVerificationStatus): Promise<SellerApplication[]> {
    const res = await api.get<{ data: BackendSellerApplication[] }>('/sellers/applications', {
      params: { status, limit: 100 },
    })
    return res.data.data.map(mapApplication)
  },

  async reviewApplication(id: string, decision: 'APPROVE' | 'REJECT', note?: string): Promise<SellerVerificationStatus> {
    const res = await api.patch<{ data: { verificationStatus: SellerVerificationStatus } }>(
      `/sellers/applications/${id}/review`,
      { decision, note },
    )
    return res.data.data.verificationStatus
  },
}
