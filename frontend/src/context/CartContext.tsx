import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { getProductById } from '@/data/mock/mockProductCatalog'
import type { CartLine } from '@/types'

interface CartContextValue {
  lines: CartLine[]
  addToCart: (productId: string, quantity?: number) => void
  removeFromCart: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  toggleSaveForLater: (productId: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
}

const DELIVERY_FLAT_FEE = 60
const FREE_DELIVERY_THRESHOLD = 1000

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
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
