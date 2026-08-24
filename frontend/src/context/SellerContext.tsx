import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { orderService } from '@/services/orderService'
import { productService } from '@/services/productService'
import { useAuth } from '@/context/AuthContext'
import type { Product, SellerOrder } from '@/types'

const STATUS_SEQUENCE: SellerOrder['status'][] = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']

interface SellerContextValue {
  listings: Product[]
  isLoadingListings: boolean
  refreshListings: () => Promise<void>
  toggleListingActive: (id: string) => Promise<void>
  removeListing: (id: string) => Promise<void>
  sellerOrders: SellerOrder[]
  isLoadingOrders: boolean
  advanceSellerOrderStatus: (id: string) => Promise<void>
  refreshSellerOrders: () => Promise<void>
}

const SellerContext = createContext<SellerContextValue | null>(null)

export function SellerProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isSeller } = useAuth()
  const [listings, setListings] = useState<Product[]>([])
  const [isLoadingListings, setIsLoadingListings] = useState(false)
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  // The backend only includes a seller's inactive products in this list when
  // sellerId matches the caller's own id — see product.service.ts — so this
  // is the seller's true full inventory, not just what buyers can see.
  const refreshListings = useCallback(async () => {
    if (!isAuthenticated || !isSeller || !user) {
      setListings([])
      return
    }
    setIsLoadingListings(true)
    try {
      const { items } = await productService.list({ sellerId: user.id, limit: 100 })
      setListings(items)
    } finally {
      setIsLoadingListings(false)
    }
  }, [isAuthenticated, isSeller, user])

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
          updatedAt: o.updatedAt,
        })),
      )
    } finally {
      setIsLoadingOrders(false)
    }
  }, [isAuthenticated, isSeller])

  useEffect(() => {
    refreshListings()
    refreshSellerOrders()
  }, [refreshListings, refreshSellerOrders])

  const toggleListingActive = useCallback(async (id: string) => {
    const current = listings.find((l) => l.id === id)
    if (!current) return
    const updated = await productService.update(id, { isActive: !current.isActive })
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, isActive: updated.isActive } : l)))
  }, [listings])

  const removeListing = useCallback(async (id: string) => {
    await productService.remove(id)
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
      isLoadingListings,
      refreshListings,
      toggleListingActive,
      removeListing,
      sellerOrders,
      isLoadingOrders,
      advanceSellerOrderStatus,
      refreshSellerOrders,
    }),
    [
      listings,
      isLoadingListings,
      refreshListings,
      toggleListingActive,
      removeListing,
      sellerOrders,
      isLoadingOrders,
      advanceSellerOrderStatus,
      refreshSellerOrders,
    ],
  )

  return <SellerContext.Provider value={value}>{children}</SellerContext.Provider>
}

export function useSeller(): SellerContextValue {
  const ctx = useContext(SellerContext)
  if (!ctx) throw new Error('useSeller must be used within a SellerProvider')
  return ctx
}
