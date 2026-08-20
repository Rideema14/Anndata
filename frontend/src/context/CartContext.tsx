import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { cartService } from '@/services/cartService'
import { useAuth } from '@/context/AuthContext'
import type { CartLine } from '@/types'

interface CartContextValue {
  lines: CartLine[]
  isLoading: boolean
  addToCart: (productId: string, quantity?: number, variantId?: string) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  setQuantity: (productId: string, quantity: number) => Promise<void>
  toggleSaveForLater: (productId: string) => void
  clearCart: () => Promise<void>
  refresh: () => Promise<void>
  itemCount: number
  subtotal: number
}

const DELIVERY_FLAT_FEE = 49
const FREE_DELIVERY_THRESHOLD = 999

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [rawLines, setRawLines] = useState<CartLine[]>([])
  // Saved-for-later has no backend equivalent — tracked locally by productId.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setRawLines([])
      return
    }
    setIsLoading(true)
    try {
      const cart = await cartService.get()
      setRawLines(cart.lines)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const lines = useMemo<CartLine[]>(
    () => rawLines.map((l) => ({ ...l, savedForLater: savedIds.has(l.productId) })),
    [rawLines, savedIds],
  )

  const addToCart = useCallback(
    async (productId: string, quantity = 1, variantId?: string) => {
      if (!isAuthenticated) return
      const cart = await cartService.addItem(productId, quantity, variantId)
      setRawLines(cart.lines)
      setSavedIds((prev) => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    },
    [isAuthenticated],
  )

  const removeFromCart = useCallback(
    async (productId: string) => {
      const line = rawLines.find((l) => l.productId === productId)
      if (!line?.itemId) return
      const cart = await cartService.removeItem(line.itemId)
      setRawLines(cart.lines)
    },
    [rawLines],
  )

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      const line = rawLines.find((l) => l.productId === productId)
      if (!line?.itemId) return
      const cart = await cartService.updateQuantity(line.itemId, Math.max(1, quantity))
      setRawLines(cart.lines)
    },
    [rawLines],
  )

  const toggleSaveForLater = useCallback((productId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }, [])

  const clearCart = useCallback(async () => {
    const cart = await cartService.clear()
    setRawLines(cart.lines)
    setSavedIds(new Set())
  }, [])

  const { itemCount, subtotal } = useMemo(() => {
    const active = lines.filter((l) => !l.savedForLater)
    const count = active.reduce((sum, l) => sum + l.quantity, 0)
    const sub = active.reduce((sum, l) => sum + (l.lineTotal ?? (l.product?.price ?? 0) * l.quantity), 0)
    return { itemCount: count, subtotal: Math.round(sub * 100) / 100 }
  }, [lines])

  const value = useMemo(
    () => ({
      lines,
      isLoading,
      addToCart,
      removeFromCart,
      setQuantity,
      toggleSaveForLater,
      clearCart,
      refresh,
      itemCount,
      subtotal,
    }),
    [lines, isLoading, addToCart, removeFromCart, setQuantity, toggleSaveForLater, clearCart, refresh, itemCount, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}

export function getDeliveryFee(subtotal: number): number {
  return subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FLAT_FEE
}
