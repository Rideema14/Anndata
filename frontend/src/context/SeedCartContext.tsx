import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { seedCartService, seedOrderService, type SeedCartLine } from '@/services/seedService'
import { useAuth } from '@/context/AuthContext'
import type { OrderSummary } from '@/types'

interface SeedCartContextValue {
  lines: SeedCartLine[]
  isLoading: boolean
  addToCart: (seedId: string, quantity?: number, variantId?: string) => Promise<void>
  removeFromCart: (seedId: string) => Promise<void>
  setQuantity: (seedId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  refresh: () => Promise<void>
  itemCount: number
  subtotal: number
  seedOrders: OrderSummary[]
  isLoadingOrders: boolean
  refreshSeedOrders: () => Promise<void>
}

const SeedCartContext = createContext<SeedCartContextValue | null>(null)

export function SeedCartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [lines, setLines] = useState<SeedCartLine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [seedOrders, setSeedOrders] = useState<OrderSummary[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setLines([])
      return
    }
    setIsLoading(true)
    try {
      const cart = await seedCartService.get()
      setLines(cart.lines)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  const refreshSeedOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setSeedOrders([])
      return
    }
    setIsLoadingOrders(true)
    try {
      const { items } = await seedOrderService.list({ limit: 50 })
      setSeedOrders(items)
    } finally {
      setIsLoadingOrders(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
    refreshSeedOrders()
  }, [refresh, refreshSeedOrders])

  const addToCart = useCallback(async (seedId: string, quantity = 1, variantId?: string) => {
    const cart = await seedCartService.addItem(seedId, quantity, variantId)
    setLines(cart.lines)
  }, [])

  const removeFromCart = useCallback(
    async (seedId: string) => {
      const line = lines.find((l) => l.seedId === seedId)
      if (!line) return
      const cart = await seedCartService.removeItem(line.itemId)
      setLines(cart.lines)
    },
    [lines],
  )

  const setQuantity = useCallback(
    async (seedId: string, quantity: number) => {
      const line = lines.find((l) => l.seedId === seedId)
      if (!line) return
      const cart = await seedCartService.updateQuantity(line.itemId, Math.max(1, quantity))
      setLines(cart.lines)
    },
    [lines],
  )

  const clearCart = useCallback(async () => {
    const cart = await seedCartService.clear()
    setLines(cart.lines)
  }, [])

  const { itemCount, subtotal } = useMemo(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0)
    const sub = lines.reduce((sum, l) => sum + l.lineTotal, 0)
    return { itemCount: count, subtotal: Math.round(sub * 100) / 100 }
  }, [lines])

  const value = useMemo(
    () => ({
      lines,
      isLoading,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
      refresh,
      itemCount,
      subtotal,
      seedOrders,
      isLoadingOrders,
      refreshSeedOrders,
    }),
    [
      lines,
      isLoading,
      addToCart,
      removeFromCart,
      setQuantity,
      clearCart,
      refresh,
      itemCount,
      subtotal,
      seedOrders,
      isLoadingOrders,
      refreshSeedOrders,
    ],
  )

  return <SeedCartContext.Provider value={value}>{children}</SeedCartContext.Provider>
}

export function useSeedCart(): SeedCartContextValue {
  const ctx = useContext(SeedCartContext)
  if (!ctx) throw new Error('useSeedCart must be used within a SeedCartProvider')
  return ctx
}
