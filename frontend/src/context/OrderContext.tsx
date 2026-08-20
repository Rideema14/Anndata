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
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
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
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders(): OrderContextValue {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrders must be used within an OrderProvider')
  return ctx
}
