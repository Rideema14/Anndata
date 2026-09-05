import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { orderService } from '@/services/orderService'
import { productService } from '@/services/productService'
import { useAuth } from '@/context/AuthContext'
import type { Product, SellerOrder } from '@/types'

interface SellerContextValue {
  listings: Product[]
  isLoadingListings: boolean
  refreshListings: () => Promise<void>
  toggleListingActive: (id: string) => Promise<void>
  removeListing: (id: string) => Promise<void>
  sellerOrders: SellerOrder[]
  isLoadingOrders: boolean
  isUpdatingOrder: boolean
  /** The seller's ENTIRE shipment-management action: submit courier + AWB. This moves the order straight to "shipped". */
  submitShipmentForOrder: (
    id: string,
    shipment: { carrierCode: string; awb: string; carrierName?: string; shipmentDate?: string; note?: string },
  ) => Promise<void>
  refreshSellerOrders: () => Promise<void>
}

const SellerContext = createContext<SellerContextValue | null>(null)

export function SellerProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isSeller } = useAuth()
  const [listings, setListings] = useState<Product[]>([])
  const [isLoadingListings, setIsLoadingListings] = useState(false)
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false)

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
          shipment: o.shipment,
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

  // This is the seller's ONLY write action on an order's shipment — no
  // status field, nothing else. Submitting moves the order straight to
  // "shipped"; every status after that is a manual admin action.
  const submitShipmentForOrder = useCallback(
    async (id: string, shipment: { carrierCode: string; awb: string; carrierName?: string; shipmentDate?: string; note?: string }) => {
      setIsUpdatingOrder(true)
      try {
        const updated = await orderService.submitShipment(id, shipment)
        setSellerOrders((prev) =>
          prev.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: updated.status,
                  shipment: updated.shipment
                    ? { carrierCode: updated.shipment.carrierCode, carrierName: updated.shipment.carrierName, awb: updated.shipment.awb }
                    : o.shipment,
                }
              : o,
          ),
        )
      } finally {
        setIsUpdatingOrder(false)
      }
    },
    [],
  )

  const value = useMemo(
    () => ({
      listings,
      isLoadingListings,
      refreshListings,
      toggleListingActive,
      removeListing,
      sellerOrders,
      isLoadingOrders,
      isUpdatingOrder,
      submitShipmentForOrder,
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
      isUpdatingOrder,
      submitShipmentForOrder,
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
