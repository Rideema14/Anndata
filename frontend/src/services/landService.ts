import { api } from './api'
import type { PaginationMeta } from './productService'

/* =========================================================
   BACKEND SHAPES
========================================================= */

export type BackendLandDealType = 'SALE' | 'LEASE'
export type BackendVisitStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'

export interface BackendLandImage {
  id: string
  landId: string
  url: string
  publicId?: string | null
  isPrimary: boolean
  sortOrder: number
  createdAt: string
}

export interface BackendLandItem {
  id: string
  sellerId: string
  title: string
  slug: string
  description?: string | null
  areaAcres: number | string
  dealType: BackendLandDealType
  price: number | string
  location: string
  city?: string | null
  state?: string | null
  latitude?: number | null
  longitude?: number | null
  soilType?: string | null
  waterSource?: string | null
  isActive: boolean
  viewCount: number
  createdAt: string
  updatedAt: string
  images?: BackendLandImage[]
  seller?: {
    id: string
    name: string
    profileImage?: string | null
    phone?: string | null
  }
}

export interface BackendLandVisitRequest {
  id: string
  landId: string
  buyerId: string
  visitDate: string
  visitTime: string
  message?: string | null
  status: BackendVisitStatus
  responseNote?: string | null
  createdAt: string
  updatedAt: string
  land?: {
    id: string
    title: string
    slug: string
    sellerId: string
    location: string
  }
  buyer?: {
    id: string
    name: string
    phone?: string | null
    email: string
  }
}

/* =========================================================
   PUBLIC TYPES FOR UI
========================================================= */

export interface LandQueryParams {
  search?: string
  dealType?: BackendLandDealType
  sellerId?: string
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc'
  page?: number
  limit?: number
}

export interface CreateLandInput {
  title: string
  description?: string
  areaAcres: number
  dealType: BackendLandDealType
  price: number
  location: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  soilType?: string
  waterSource?: string
}

export interface UpdateLandInput extends Partial<CreateLandInput> {
  isActive?: boolean
}

export interface CreateVisitRequestInput {
  visitDate: string
  visitTime: string
  message?: string
}

export interface UpdateVisitStatusInput {
  status: BackendVisitStatus
  responseNote?: string
}

/* =========================================================
   API METHODS
========================================================= */

/** Fetch paginated/filtered land listings from backend */
export async function fetchLandListings(params: LandQueryParams = {}): Promise<{
  items: BackendLandItem[]
  meta: PaginationMeta
}> {
  const response = await api.get<{
    success: boolean
    data: BackendLandItem[]
    meta?: { pagination: PaginationMeta }
  }>('/land', { params })

  return {
    items: response.data.data || [],
    meta: response.data.meta?.pagination || { page: 1, limit: 20, totalItems: (response.data.data || []).length, totalPages: 1 },
  }
}

/** Fetch land listing details by slug (or ID fallback) */
export async function fetchLandBySlug(slug: string): Promise<BackendLandItem> {
  const response = await api.get<{
    success: boolean
    data: BackendLandItem
  }>(`/land/${slug}`)
  return response.data.data
}

/** Fetch authenticated seller's land listings */
export async function fetchMyLandListings(params: { page?: number; limit?: number } = {}): Promise<{
  items: BackendLandItem[]
  meta: PaginationMeta
}> {
  const response = await api.get<{
    success: boolean
    data: BackendLandItem[]
    meta?: { pagination: PaginationMeta }
  }>('/land/my-listings', { params })

  return {
    items: response.data.data || [],
    meta: response.data.meta?.pagination || { page: 1, limit: 20, totalItems: (response.data.data || []).length, totalPages: 1 },
  }
}

/** Create a new land listing */
export async function createLandListing(data: CreateLandInput): Promise<BackendLandItem> {
  const response = await api.post<{
    success: boolean
    data: BackendLandItem
  }>('/land', data)
  return response.data.data
}

/** Update an existing land listing */
export async function updateLandListing(id: string, data: UpdateLandInput): Promise<BackendLandItem> {
  const response = await api.patch<{
    success: boolean
    data: BackendLandItem
  }>(`/land/${id}`, data)
  return response.data.data
}

/** Delete a land listing */
export async function deleteLandListing(id: string): Promise<void> {
  await api.delete(`/land/${id}`)
}

/** Upload images for a land listing */
export async function uploadLandImages(landId: string, files: File[]): Promise<BackendLandImage[]> {
  const formData = new FormData()
  files.forEach((file) => formData.append('images', file))

  const response = await api.post<{
    success: boolean
    data: BackendLandImage[]
  }>(`/land/${landId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data
}

/** Remove an image from a land listing */
export async function removeLandImage(landId: string, imageId: string): Promise<void> {
  await api.delete(`/land/${landId}/images/${imageId}`)
}

/** Submit a site visit request for a land listing */
export async function requestLandVisit(landId: string, data: CreateVisitRequestInput): Promise<BackendLandVisitRequest> {
  const response = await api.post<{
    success: boolean
    data: BackendLandVisitRequest
  }>(`/land/${landId}/visit-requests`, data)
  return response.data.data
}

/** Fetch visit requests for a seller's specific land listing */
export async function fetchLandVisitRequests(
  landId: string,
  params: { status?: BackendVisitStatus; page?: number; limit?: number } = {},
): Promise<{ items: BackendLandVisitRequest[]; meta: PaginationMeta }> {
  const response = await api.get<{
    success: boolean
    data: BackendLandVisitRequest[]
    meta?: { pagination: PaginationMeta }
  }>(`/land/${landId}/visit-requests`, { params })

  return {
    items: response.data.data || [],
    meta: response.data.meta?.pagination || { page: 1, limit: 20, totalItems: (response.data.data || []).length, totalPages: 1 },
  }
}

/** Fetch current buyer's requested site visits */
export async function fetchMyVisitRequests(
  params: { status?: BackendVisitStatus; page?: number; limit?: number } = {},
): Promise<{ items: BackendLandVisitRequest[]; meta: PaginationMeta }> {
  const response = await api.get<{
    success: boolean
    data: BackendLandVisitRequest[]
    meta?: { pagination: PaginationMeta }
  }>('/land/visit-requests/my', { params })

  return {
    items: response.data.data || [],
    meta: response.data.meta?.pagination || { page: 1, limit: 20, totalItems: (response.data.data || []).length, totalPages: 1 },
  }
}

/** Fetch details of a single visit request */
export async function fetchVisitRequestById(id: string): Promise<BackendLandVisitRequest> {
  const response = await api.get<{
    success: boolean
    data: BackendLandVisitRequest
  }>(`/land/visit-requests/${id}`)
  return response.data.data
}

/** Update status of a visit request (Accept, Reject, Complete, Cancel) */
export async function updateVisitStatus(id: string, data: UpdateVisitStatusInput): Promise<BackendLandVisitRequest> {
  const response = await api.patch<{
    success: boolean
    data: BackendLandVisitRequest
  }>(`/land/visit-requests/${id}/status`, data)
  return response.data.data
}
