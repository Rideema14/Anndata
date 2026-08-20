<<<<<<< HEAD
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { orderService } from '@/services/orderService'
import { useAuth } from '@/context/AuthContext'
import type { OrderStatus, OrderSummary } from '@/types'

/** The 6-stage happy-path sequence a normal (non-cancelled/returned) order moves through. */
export const STATUS_SEQUENCE: OrderStatus[] = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered']

interface OrderContextValue {
  orders: OrderSummary[]
  isLoading: boolean
  refresh: () => Promise<void>
  statusSequence: OrderStatus[]
=======
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Order, OrderItem } from '@/types'

const STATUS_SEQUENCE: Order['status'][] = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']

const initialOrders: Order[] = [
  {
    id: 'AD48213',
    items: [{ productId: 'prd_2', name: 'NPK 19:19:19 Fertilizer', quantity: 2, price: 1180 }],
    total: 2360,
    status: 'shipped',
    placedAt: '2026-08-13T09:00:00.000Z',
    address: 'Village Bahoriband, Near Primary School, Katni, MP – 483501',
    paymentMethod: 'UPI',
  },
  {
    id: 'AD47950',
    items: [{ productId: 'prd_9', name: 'Wheat Seeds (HD-3086)', quantity: 1, price: 1650 }],
    total: 1650,
    status: 'delivered',
    placedAt: '2026-08-05T09:00:00.000Z',
    address: 'Village Bahoriband, Near Primary School, Katni, MP – 483501',
    paymentMethod: 'Cash on Delivery',
  },
]

interface OrderContextValue {
  orders: Order[]
  getOrder: (id: string) => Order | undefined
  placeOrder: (items: OrderItem[], address: string, paymentMethod: string) => Order
  advanceStatus: (id: string) => void
  statusSequence: Order['status'][]
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
<<<<<<< HEAD
  const { isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([])
      return
    }
    setIsLoading(true)
    try {
      const { items } = await orderService.list({ limit: 50 })
      setOrders(items)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ orders, isLoading, refresh, statusSequence: STATUS_SEQUENCE }),
    [orders, isLoading, refresh],
=======
  const [orders, setOrders] = useState<Order[]>(initialOrders)

  const getOrder = useCallback((id: string) => orders.find((o) => o.id === id), [orders])

  const placeOrder = useCallback((items: OrderItem[], address: string, paymentMethod: string): Order => {
    const order: Order = {
      id: `AD${Math.floor(10000 + Math.random() * 89999)}`,
      items,
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      status: 'placed',
      placedAt: new Date().toISOString(),
      address,
      paymentMethod,
    }
    setOrders((prev) => [order, ...prev])
    return order
  }, [])

  const advanceStatus = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o
        const currentIndex = STATUS_SEQUENCE.indexOf(o.status)
        const next = STATUS_SEQUENCE[Math.min(currentIndex + 1, STATUS_SEQUENCE.length - 1)]
        return { ...o, status: next }
      }),
    )
  }, [])

  const value = useMemo(
    () => ({ orders, getOrder, placeOrder, advanceStatus, statusSequence: STATUS_SEQUENCE }),
    [orders, getOrder, placeOrder, advanceStatus],
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders(): OrderContextValue {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrders must be used within an OrderProvider')
  return ctx
}
