import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { orderService } from '@/services/orderService'
import { useAuth } from '@/context/AuthContext'
import type { Listing, ListingStatus, SellerOrder } from '@/types'

const initialListings: Listing[] = [
  { id: 'lst_1', name: 'Soybean Seeds — JS-9560', categorySlug: 'seeds', price: 1450, unit: '30 kg bag', stock: 42, status: 'active', createdAt: '2026-06-01T00:00:00.000Z' },
  { id: 'lst_2', name: 'Wheat Seeds — HD-3086', categorySlug: 'seeds', price: 1650, unit: '40 kg bag', stock: 80, status: 'active', createdAt: '2026-06-25T00:00:00.000Z' },
  { id: 'lst_3', name: 'Vermicompost — Organic Manure', categorySlug: 'fertilizers', price: 380, unit: '25 kg bag', stock: 0, status: 'inactive', createdAt: '2026-05-10T00:00:00.000Z' },
  { id: 'lst_4', name: 'Power Tiller Rental Listing', categorySlug: 'machinery', price: 900, unit: 'per day', stock: 1, status: 'pending', createdAt: '2026-08-10T00:00:00.000Z' },
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
  isLoadingOrders: boolean
  advanceSellerOrderStatus: (id: string) => Promise<void>
  refreshSellerOrders: () => Promise<void>
}

const SellerContext = createContext<SellerContextValue | null>(null)

export function SellerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isSeller } = useAuth()
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  // GET /orders is scoped server-side by role: a seller only ever gets back
  // orders that contain their own products (see backend order.service.ts).
  // That's what makes this safe to call here without any client-side filter.
  const refreshSellerOrders = useCallback(async () => {
    if (!isAuthenticated || !isSeller) {
      setSellerOrders([])
      return
    }
    setIsLoadingOrders(true)
    try {
      const { items } = await orderService.list({ limit: 50, scope: 'selling' })
      setSellerOrders(
        items.map((o) => ({
          id: o.id,
          buyerName: o.buyerName ?? 'Buyer',
          itemsLabel: o.itemsLabel,
          total: o.itemsSubtotal ?? o.total,
          status: o.status,
          placedAt: o.placedAt,
        })),
      )
    } finally {
      setIsLoadingOrders(false)
    }
  }, [isAuthenticated, isSeller])

  useEffect(() => {
    refreshSellerOrders()
  }, [refreshSellerOrders])

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

  const advanceSellerOrderStatus = useCallback(async (id: string) => {
    const current = sellerOrders.find((o) => o.id === id)
    if (!current) return
    const idx = STATUS_SEQUENCE.indexOf(current.status)
    const nextStatus = STATUS_SEQUENCE[Math.min(idx + 1, STATUS_SEQUENCE.length - 1)]
    // The backend re-verifies the caller has a product on this order before
    // allowing the status change — this can't be used to touch someone else's order.
    const updated = await orderService.updateStatus(id, nextStatus)
    setSellerOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)))
  }, [sellerOrders])

  const value = useMemo(
    () => ({
      listings,
      addListing,
      setListingStatus,
      removeListing,
      sellerOrders,
      isLoadingOrders,
      advanceSellerOrderStatus,
      refreshSellerOrders,
    }),
    [listings, addListing, setListingStatus, removeListing, sellerOrders, isLoadingOrders, advanceSellerOrderStatus, refreshSellerOrders],
  )

  return <SellerContext.Provider value={value}>{children}</SellerContext.Provider>
}

export function useSeller(): SellerContextValue {
  const ctx = useContext(SellerContext)
  if (!ctx) throw new Error('useSeller must be used within a SellerProvider')
  return ctx
}