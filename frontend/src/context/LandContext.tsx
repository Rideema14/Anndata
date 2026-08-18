import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { mockLandListings, type LandListing } from '@/data/mock/mockLand'

export type VisitStatus = 'pending' | 'accepted' | 'rejected' | 'completed'

export interface VisitRequest {
  id: string
  landId: string
  date: string
  time: string
  message: string
  status: VisitStatus
}

type NewLandInput = Omit<LandListing, 'id'>

interface LandContextValue {
  visitRequests: VisitRequest[]
  requestVisit: (landId: string, date: string, time: string, message: string) => VisitRequest
  getVisitForLand: (landId: string) => VisitRequest | undefined
  allListings: LandListing[]
  sellerListings: LandListing[]
  addLandListing: (input: NewLandInput) => LandListing
}

const LandContext = createContext<LandContextValue | null>(null)

export function LandProvider({ children }: { children: ReactNode }) {
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([])
  const [sellerListings, setSellerListings] = useState<LandListing[]>([])

  const requestVisit = useCallback((landId: string, date: string, time: string, message: string): VisitRequest => {
    const request: VisitRequest = { id: `visit_${Date.now()}`, landId, date, time, message, status: 'pending' }
    setVisitRequests((prev) => [...prev.filter((r) => r.landId !== landId), request])
    return request
  }, [])

  const getVisitForLand = useCallback((landId: string) => visitRequests.find((r) => r.landId === landId), [visitRequests])

  const addLandListing = useCallback((input: NewLandInput): LandListing => {
    const listing: LandListing = { ...input, id: `land_${Date.now()}` }
    setSellerListings((prev) => [listing, ...prev])
    return listing
  }, [])

  const allListings = useMemo(() => [...sellerListings, ...mockLandListings], [sellerListings])

  const value = useMemo(
    () => ({ visitRequests, requestVisit, getVisitForLand, allListings, sellerListings, addLandListing }),
    [visitRequests, requestVisit, getVisitForLand, allListings, sellerListings, addLandListing],
  )

  return <LandContext.Provider value={value}>{children}</LandContext.Provider>
}

export function useLand(): LandContextValue {
  const ctx = useContext(LandContext)
  if (!ctx) throw new Error('useLand must be used within a LandProvider')
  return ctx
}
