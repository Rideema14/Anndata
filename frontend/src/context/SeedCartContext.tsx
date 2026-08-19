import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { getProductById } from '@/data/mock/mockProductCatalog'
import type { CartLine, Order, OrderItem } from '@/types'

interface SeedOrder extends Order {}

const initialSeedOrders: SeedOrder[] = [
  {
    id: 'SD-3301',
    items: [{ productId: 'prd_1', name: 'Soybean Seeds — JS-9560', quantity: 1, price: 1450 }],
    total: 1450,
    status: 'delivered',
    placedAt: '2026-07-20T09:00:00.000Z',
    address: 'Village Bahoriband, Near Primary School, Katni, MP – 483501',
    paymentMethod: 'UPI',
  },
]

interface SeedCartContextValue {
  lines: CartLine[]
  addToCart: (productId: string, quantity?: number) => void
  removeFromCart: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  subtotal: number
  itemCount: number
  seedOrders: SeedOrder[]
  placeSeedOrder: (address: string, paymentMethod: string) => SeedOrder
}

const SeedCartContext = createContext<SeedCartContextValue | null>(null)

export function SeedCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [seedOrders, setSeedOrders] = useState<SeedOrder[]>(initialSeedOrders)

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId)
      if (existing) return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l))
      return [...prev, { productId, quantity, savedForLater: false }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, quantity) } : l)))
  }, [])

  const clearCart = useCallback(() => setLines([]), [])

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + (getProductById(l.productId)?.price ?? 0) * l.quantity, 0),
    [lines],
  )
  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines])

  const placeSeedOrder = useCallback(
    (address: string, paymentMethod: string): SeedOrder => {
      const items: OrderItem[] = lines
        .map((l) => {
          const product = getProductById(l.productId)
          return product ? { productId: product.id, name: product.name, quantity: l.quantity, price: product.price } : null
        })
        .filter((i): i is OrderItem => !!i)
      const order: SeedOrder = {
        id: `SD-${Math.floor(1000 + Math.random() * 8999)}`,
        items,
        total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        status: 'placed',
        placedAt: new Date().toISOString(),
        address,
        paymentMethod,
      }
      setSeedOrders((prev) => [order, ...prev])
      setLines([])
      return order
    },
    [lines],
  )

  const value = useMemo(
    () => ({ lines, addToCart, removeFromCart, setQuantity, clearCart, subtotal, itemCount, seedOrders, placeSeedOrder }),
    [lines, addToCart, removeFromCart, setQuantity, clearCart, subtotal, itemCount, seedOrders, placeSeedOrder],
  )

  return <SeedCartContext.Provider value={value}>{children}</SeedCartContext.Provider>
}

export function useSeedCart(): SeedCartContextValue {
  const ctx = useContext(SeedCartContext)
  if (!ctx) throw new Error('useSeedCart must be used within a SeedCartProvider')
  return ctx
}
