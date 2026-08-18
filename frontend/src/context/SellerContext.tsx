import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Listing, ListingStatus, SellerOrder } from '@/types'

const initialListings: Listing[] = [
  { id: 'lst_1', name: 'Soybean Seeds — JS-9560', categorySlug: 'seeds', price: 1450, unit: '30 kg bag', stock: 42, status: 'active', createdAt: '2026-06-01T00:00:00.000Z' },
  { id: 'lst_2', name: 'Wheat Seeds — HD-3086', categorySlug: 'seeds', price: 1650, unit: '40 kg bag', stock: 80, status: 'active', createdAt: '2026-06-25T00:00:00.000Z' },
  { id: 'lst_3', name: 'Vermicompost — Organic Manure', categorySlug: 'fertilizers', price: 380, unit: '25 kg bag', stock: 0, status: 'inactive', createdAt: '2026-05-10T00:00:00.000Z' },
  { id: 'lst_4', name: 'Power Tiller Rental Listing', categorySlug: 'machinery', price: 900, unit: 'per day', stock: 1, status: 'pending', createdAt: '2026-08-10T00:00:00.000Z' },
]

const initialSellerOrders: SellerOrder[] = [
  { id: 'SO-7841', buyerName: 'Sunita Verma', itemsLabel: 'Soybean Seeds × 2 bags', total: 2900, status: 'placed', placedAt: '2026-08-15T14:12:00.000Z' },
  { id: 'SO-7822', buyerName: 'Gurpreet Singh', itemsLabel: 'Wheat Seeds × 1 bag', total: 1650, status: 'confirmed', placedAt: '2026-08-14T10:05:00.000Z' },
  { id: 'SO-7790', buyerName: 'Manoj Patel', itemsLabel: 'Vermicompost × 4 bags', total: 1520, status: 'shipped', placedAt: '2026-08-11T08:30:00.000Z' },
]

const STATUS_SEQUENCE: SellerOrder['status'][] = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']

interface NewListingInput {
  name: string
  categorySlug: string
  price: number
  unit: string
  stock: number
}

interface SellerContextValue {
  listings: Listing[]
  addListing: (input: NewListingInput) => void
  setListingStatus: (id: string, status: ListingStatus) => void
  removeListing: (id: string) => void
  sellerOrders: SellerOrder[]
  advanceSellerOrderStatus: (id: string) => void
}

const SellerContext = createContext<SellerContextValue | null>(null)

export function SellerProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>(initialSellerOrders)

  const addListing = useCallback((input: NewListingInput) => {
    const listing: Listing = {
      id: `lst_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...input,
    }
    setListings((prev) => [listing, ...prev])
  }, [])

  const setListingStatus = useCallback((id: string, status: ListingStatus) => {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
  }, [])

  const removeListing = useCallback((id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const advanceSellerOrderStatus = useCallback((id: string) => {
    setSellerOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o
        const idx = STATUS_SEQUENCE.indexOf(o.status)
        return { ...o, status: STATUS_SEQUENCE[Math.min(idx + 1, STATUS_SEQUENCE.length - 1)] }
      }),
    )
  }, [])

  const value = useMemo(
    () => ({ listings, addListing, setListingStatus, removeListing, sellerOrders, advanceSellerOrderStatus }),
    [listings, addListing, setListingStatus, removeListing, sellerOrders, advanceSellerOrderStatus],
  )

  return <SellerContext.Provider value={value}>{children}</SellerContext.Provider>
}

export function useSeller(): SellerContextValue {
  const ctx = useContext(SellerContext)
  if (!ctx) throw new Error('useSeller must be used within a SellerProvider')
  return ctx
}
