<<<<<<< HEAD
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { cartService } from '@/services/cartService'
import { useAuth } from '@/context/AuthContext'
=======
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { getProductById } from '@/data/mock/mockProductCatalog'
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
import type { CartLine } from '@/types'

interface CartContextValue {
  lines: CartLine[]
<<<<<<< HEAD
  isLoading: boolean
  addToCart: (productId: string, quantity?: number, variantId?: string) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  setQuantity: (productId: string, quantity: number) => Promise<void>
  toggleSaveForLater: (productId: string) => void
  clearCart: () => Promise<void>
  refresh: () => Promise<void>
=======
  addToCart: (productId: string, quantity?: number) => void
  removeFromCart: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  toggleSaveForLater: (productId: string) => void
  clearCart: () => void
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  itemCount: number
  subtotal: number
}

<<<<<<< HEAD
const DELIVERY_FLAT_FEE = 49
const FREE_DELIVERY_THRESHOLD = 999
=======
const DELIVERY_FLAT_FEE = 60
const FREE_DELIVERY_THRESHOLD = 1000
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
<<<<<<< HEAD
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
=======
  const [lines, setLines] = useState<CartLine[]>([
    { productId: 'prd_2', quantity: 2, savedForLater: false },
    { productId: 'prd_1', quantity: 1, savedForLater: false },
  ])

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId)
      if (existing) {
        return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + quantity, savedForLater: false } : l))
      }
      return [...prev, { productId, quantity, savedForLater: false }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, quantity) } : l)),
    )
  }, [])

  const toggleSaveForLater = useCallback((productId: string) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, savedForLater: !l.savedForLater } : l)))
  }, [])

  const clearCart = useCallback(() => setLines([]), [])

  const { itemCount, subtotal } = useMemo(() => {
    const active = lines.filter((l) => !l.savedForLater)
    const count = active.reduce((sum, l) => sum + l.quantity, 0)
    const sub = active.reduce((sum, l) => {
      const product = getProductById(l.productId)
      return sum + (product ? product.price * l.quantity : 0)
    }, 0)
    return { itemCount: count, subtotal: sub }
  }, [lines])

  const value = useMemo(
    () => ({ lines, addToCart, removeFromCart, setQuantity, toggleSaveForLater, clearCart, itemCount, subtotal }),
    [lines, addToCart, removeFromCart, setQuantity, toggleSaveForLater, clearCart, itemCount, subtotal],
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
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
