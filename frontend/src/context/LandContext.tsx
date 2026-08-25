import { createContext, useCallback, useContext, useMemo, useState, useEffect, type ReactNode } from 'react'
import {
  fetchLandListings,
  fetchLandBySlug,
  fetchMyLandListings,
  createLandListing,
  updateLandListing,
  deleteLandListing,
  uploadLandImages,
  removeLandImage,
  requestLandVisit,
  fetchLandVisitRequests,
  fetchMyVisitRequests,
  updateVisitStatus as apiUpdateVisitStatus,
  type BackendLandItem,
  type BackendLandVisitRequest,
  type BackendVisitStatus,
  type LandQueryParams,
  type CreateLandInput,
  type UpdateLandInput,
} from '@/services/landService'
import type { PaginationMeta } from '@/services/productService'
import { getApiErrorMessage } from '@/services/api'
import { useAuth } from './AuthContext'

interface LandContextValue {
  listings: BackendLandItem[]
  sellerListings: BackendLandItem[]
  selectedListing: BackendLandItem | null
  visitRequests: BackendLandVisitRequest[]
  sellerVisitRequests: BackendLandVisitRequest[]
  meta: PaginationMeta | null
  isLoading: boolean
  isActionLoading: boolean
  error: string | null
  
  // Public / Buyer Methods
  fetchListings: (params?: LandQueryParams) => Promise<void>
  getListingBySlug: (slugOrId: string) => Promise<BackendLandItem | null>
  getVisitForLand: (landId: string) => BackendLandVisitRequest | undefined
  requestVisit: (landId: string, date: string, time: string, message?: string) => Promise<BackendLandVisitRequest>
  fetchMyVisitRequests: (status?: BackendVisitStatus) => Promise<BackendLandVisitRequest[]>
  cancelVisitRequest: (visitId: string) => Promise<void>
  
  // Seller Methods
  fetchSellerListings: () => Promise<BackendLandItem[]>
  addLandListing: (data: CreateLandInput, imageFiles?: File[]) => Promise<BackendLandItem>
  updateLand: (id: string, data: UpdateLandInput) => Promise<BackendLandItem>
  deleteLand: (id: string) => Promise<void>
  uploadImages: (landId: string, files: File[]) => Promise<void>
  removeImage: (landId: string, imageId: string) => Promise<void>
  fetchSellerVisitRequests: (landId?: string, status?: BackendVisitStatus) => Promise<BackendLandVisitRequest[]>
  updateVisitStatus: (visitId: string, status: BackendVisitStatus, responseNote?: string) => Promise<BackendLandVisitRequest>
}

const LandContext = createContext<LandContextValue | null>(null)

export function LandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  
  const [listings, setListings] = useState<BackendLandItem[]>([])
  const [sellerListings, setSellerListings] = useState<BackendLandItem[]>([])
  const [selectedListing, setSelectedListing] = useState<BackendLandItem | null>(null)
  
  const [visitRequests, setVisitRequests] = useState<BackendLandVisitRequest[]>([])
  const [sellerVisitRequests, setSellerVisitRequests] = useState<BackendLandVisitRequest[]>([])
  
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch initial public land listings
  const fetchListings = useCallback(async (params: LandQueryParams = {}) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchLandListings(params)
      setListings(res.items)
      setMeta(res.meta)
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to fetch land listings')
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get land listing by slug or ID
  const getListingBySlug = useCallback(async (slugOrId: string): Promise<BackendLandItem | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const item = await fetchLandBySlug(slugOrId)
      setSelectedListing(item)
      return item
    } catch (err) {
      // Fallback: check locally loaded listings
      const local = listings.find((l) => l.slug === slugOrId || l.id === slugOrId)
      if (local) {
        setSelectedListing(local)
        return local
      }
      const msg = getApiErrorMessage(err, 'Land listing not found')
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [listings])

  // Get user's active visit request for a specific land listing
  const getVisitForLand = useCallback(
    (landId: string) => {
      return visitRequests.find((v) => v.landId === landId && v.status !== 'CANCELLED')
    },
    [visitRequests],
  )

  // Fetch buyer's own visit requests
  const fetchMyVisits = useCallback(async (status?: BackendVisitStatus) => {
    if (!user) return []
    try {
      const res = await fetchMyVisitRequests({ status })
      setVisitRequests(res.items)
      return res.items
    } catch (err) {
      console.error('Failed to fetch visit requests:', err)
      return []
    }
  }, [user])

  // Request a site visit
  const requestVisit = useCallback(
    async (landId: string, visitDate: string, visitTime: string, message?: string): Promise<BackendLandVisitRequest> => {
      setIsActionLoading(true)
      try {
        const newVisit = await requestLandVisit(landId, { visitDate, visitTime, message })
        setVisitRequests((prev) => [newVisit, ...prev.filter((v) => v.landId !== landId)])
        return newVisit
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to send visit request')
        throw new Error(msg)
      } finally {
        setIsActionLoading(false)
      }
    },
    [],
  )

  // Cancel visit request
  const cancelVisitRequest = useCallback(async (visitId: string) => {
    setIsActionLoading(true)
    try {
      const updated = await apiUpdateVisitStatus(visitId, { status: 'CANCELLED' })
      setVisitRequests((prev) => prev.map((v) => (v.id === visitId ? updated : v)))
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to cancel visit request')
      throw new Error(msg)
    } finally {
      setIsActionLoading(false)
    }
  }, [])

  // Fetch seller's land listings
  const fetchSellerListings = useCallback(async (): Promise<BackendLandItem[]> => {
    if (!user) return []
    setIsLoading(true)
    try {
      const res = await fetchMyLandListings({ limit: 100 })
      setSellerListings(res.items)
      return res.items
    } catch (err) {
      console.error('Failed to fetch seller land listings:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Add new land listing with optional images
  const addLandListing = useCallback(
    async (data: CreateLandInput, imageFiles?: File[]): Promise<BackendLandItem> => {
      setIsActionLoading(true)
      let created: BackendLandItem | null = null
      try {
        created = await createLandListing(data)
        if (imageFiles && imageFiles.length > 0) {
          try {
            const uploaded = await uploadLandImages(created.id, imageFiles)
            created = { ...created, images: uploaded }
          } catch (uploadErr) {
            // ACID Rollback: Delete newly created land listing if photo upload fails
            if (created?.id) {
              await deleteLandListing(created.id).catch(() => {})
            }
            throw uploadErr
          }
        }
        setSellerListings((prev) => [created!, ...prev])
        setListings((prev) => [created!, ...prev])
        return created!
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to create land listing')
        throw new Error(msg)
      } finally {
        setIsActionLoading(false)
      }
    },
    [],
  )

  // Update land listing
  const updateLand = useCallback(async (id: string, data: UpdateLandInput): Promise<BackendLandItem> => {
    setIsActionLoading(true)
    try {
      const updated = await updateLandListing(id, data)
      setSellerListings((prev) => prev.map((item) => (item.id === id ? updated : item)))
      setListings((prev) => prev.map((item) => (item.id === id ? updated : item)))
      if (selectedListing?.id === id) {
        setSelectedListing(updated)
      }
      return updated
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to update land listing')
      throw new Error(msg)
    } finally {
      setIsActionLoading(false)
    }
  }, [selectedListing])

  // Delete land listing
  const deleteLand = useCallback(async (id: string) => {
    setIsActionLoading(true)
    try {
      await deleteLandListing(id)
      setSellerListings((prev) => prev.filter((item) => item.id !== id))
      setListings((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to delete land listing')
      throw new Error(msg)
    } finally {
      setIsActionLoading(false)
    }
  }, [])

  // Upload images
  const uploadImages = useCallback(async (landId: string, files: File[]) => {
    setIsActionLoading(true)
    try {
      const newImages = await uploadLandImages(landId, files)
      setSellerListings((prev) =>
        prev.map((item) => (item.id === landId ? { ...item, images: [...(item.images || []), ...newImages] } : item)),
      )
      if (selectedListing?.id === landId) {
        setSelectedListing((prev) => (prev ? { ...prev, images: [...(prev.images || []), ...newImages] } : prev))
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to upload images')
      throw new Error(msg)
    } finally {
      setIsActionLoading(false)
    }
  }, [selectedListing])

  // Remove image
  const removeImage = useCallback(async (landId: string, imageId: string) => {
    setIsActionLoading(true)
    try {
      await removeLandImage(landId, imageId)
      setSellerListings((prev) =>
        prev.map((item) => (item.id === landId ? { ...item, images: (item.images || []).filter((img) => img.id !== imageId) } : item)),
      )
      if (selectedListing?.id === landId) {
        setSelectedListing((prev) => (prev ? { ...prev, images: (prev.images || []).filter((img) => img.id !== imageId) } : prev))
      }
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Failed to remove image')
      throw new Error(msg)
    } finally {
      setIsActionLoading(false)
    }
  }, [selectedListing])

  // Fetch seller visit requests (for a listing or all)
  const fetchSellerVisitRequests = useCallback(
    async (landId?: string, status?: BackendVisitStatus): Promise<BackendLandVisitRequest[]> => {
      setIsLoading(true)
      try {
        if (landId) {
          const res = await fetchLandVisitRequests(landId, { status })
          setSellerVisitRequests(res.items)
          return res.items
        } else {
          // If no specific landId, fetch across seller's listings
          const sellerListingsRes = await fetchMyLandListings({ limit: 50 })
          const allVisits: BackendLandVisitRequest[] = []
          await Promise.all(
            sellerListingsRes.items.map(async (l) => {
              try {
                const visitsRes = await fetchLandVisitRequests(l.id, { status })
                allVisits.push(...visitsRes.items)
              } catch (e) {
                // ignore if forbidden or no visits
              }
            }),
          )
          allVisits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setSellerVisitRequests(allVisits)
          return allVisits
        }
      } catch (err) {
        console.error('Failed to fetch seller visit requests:', err)
        return []
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // Update visit request status (Seller/Buyer)
  const updateVisitStatus = useCallback(
    async (visitId: string, status: BackendVisitStatus, responseNote?: string): Promise<BackendLandVisitRequest> => {
      setIsActionLoading(true)
      try {
        const updated = await apiUpdateVisitStatus(visitId, { status, responseNote })
        setSellerVisitRequests((prev) => prev.map((v) => (v.id === visitId ? updated : v)))
        setVisitRequests((prev) => prev.map((v) => (v.id === visitId ? updated : v)))
        return updated
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to update visit status')
        throw new Error(msg)
      } finally {
        setIsActionLoading(false)
      }
    },
    [],
  )

  // Auto-fetch buyer visits on mount/auth change
  useEffect(() => {
    if (user) {
      fetchMyVisits()
    }
  }, [user, fetchMyVisits])

  const value = useMemo(
    () => ({
      listings,
      sellerListings,
      selectedListing,
      visitRequests,
      sellerVisitRequests,
      meta,
      isLoading,
      isActionLoading,
      error,
      fetchListings,
      getListingBySlug,
      getVisitForLand,
      requestVisit,
      fetchMyVisitRequests: fetchMyVisits,
      cancelVisitRequest,
      fetchSellerListings,
      addLandListing,
      updateLand,
      deleteLand,
      uploadImages,
      removeImage,
      fetchSellerVisitRequests,
      updateVisitStatus,
    }),
    [
      listings,
      sellerListings,
      selectedListing,
      visitRequests,
      sellerVisitRequests,
      meta,
      isLoading,
      isActionLoading,
      error,
      fetchListings,
      getListingBySlug,
      getVisitForLand,
      requestVisit,
      fetchMyVisits,
      cancelVisitRequest,
      fetchSellerListings,
      addLandListing,
      updateLand,
      deleteLand,
      uploadImages,
      removeImage,
      fetchSellerVisitRequests,
      updateVisitStatus,
    ],
  )

  return <LandContext.Provider value={value}>{children}</LandContext.Provider>
}

export function useLand(): LandContextValue {
  const ctx = useContext(LandContext)
  if (!ctx) throw new Error('useLand must be used within a LandProvider')
  return ctx
}
