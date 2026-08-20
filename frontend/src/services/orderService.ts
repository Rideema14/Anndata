import { api } from './api'
import type { Order, OrderItem, OrderStatus, OrderSummary } from '@/types'
import type { PaginationMeta } from './productService'

type BackendStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED'

const STATUS_MAP: Record<BackendStatus, OrderStatus> = {
  PENDING: 'placed',
  CONFIRMED: 'confirmed',
  PROCESSING: 'packed',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
}

/** Reverse of STATUS_MAP — used only for the seller/admin status-update UI, if wired up later. */
export const REVERSE_STATUS_MAP: Record<OrderStatus, BackendStatus> = {
  placed: 'PENDING',
  confirmed: 'CONFIRMED',
  packed: 'PROCESSING',
  shipped: 'SHIPPED',
  out_for_delivery: 'OUT_FOR_DELIVERY',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
  returned: 'RETURNED',
}

interface BackendOrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number | string
  totalPrice: number | string
}
interface BackendAddress {
  addressLine1: string
  addressLine2?: string | null
  city: string
  state: string
  postalCode: string
}
interface BackendPayment {
  id: string
  razorpayOrderId: string
  amount: number | string
  status: 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
}
interface BackendOrder {
  id: string
  orderNumber: string
  status: BackendStatus
  subtotal: number | string
  shippingFee: number | string
  tax: number | string
  totalAmount: number | string
  createdAt: string
  items: BackendOrderItem[]
  address: BackendAddress
  payment?: BackendPayment | null
}

function formatAddress(a: BackendAddress): string {
  return [a.addressLine1, a.addressLine2, a.city, a.state].filter(Boolean).join(', ') + ` – ${a.postalCode}`
}

function mapItem(i: BackendOrderItem): OrderItem {
  return { productId: i.productId, name: i.productName, quantity: i.quantity, price: Number(i.unitPrice) }
}

function mapOrder(o: BackendOrder): Order {
  return {
    id: o.orderNumber,
    items: o.items.map(mapItem),
    total: Number(o.totalAmount),
    status: STATUS_MAP[o.status],
    placedAt: o.createdAt,
    address: formatAddress(o.address),
    paymentMethod: o.payment ? 'Razorpay' : 'Pending',
  }
}

function mapSummary(o: BackendOrder): OrderSummary {
  const label = o.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')
  return { id: o.orderNumber, itemsLabel: label, total: Number(o.totalAmount), status: STATUS_MAP[o.status], placedAt: o.createdAt }
}

/** Internal id (uuid) lookup — the frontend routes/displays by orderNumber, but PATCH/cancel need the real id. */
const idByOrderNumber = new Map<string, string>()

export const orderService = {
  async checkout(addressId: string, notes?: string): Promise<{ order: Order; razorpayOrderId?: string; amount?: number }> {
    const res = await api.post<{ data: { order: BackendOrder; payment: BackendPayment } }>('/orders/checkout', {
      addressId,
      notes,
    })
    const { order, payment } = res.data.data
    idByOrderNumber.set(order.orderNumber, order.id)
    return { order: mapOrder(order), razorpayOrderId: payment?.razorpayOrderId, amount: Number(payment?.amount) }
  },

  async list(params: { page?: number; limit?: number; status?: BackendStatus } = {}): Promise<{
    items: OrderSummary[]
    meta: PaginationMeta
  }> {
    const res = await api.get<{ data: BackendOrder[]; meta: { pagination: PaginationMeta } }>('/orders', { params })
    res.data.data.forEach((o) => idByOrderNumber.set(o.orderNumber, o.id))
    return { items: res.data.data.map(mapSummary), meta: res.data.meta.pagination }
  },

  /** Accepts either the internal uuid or the display order number (looked up from a prior list() call). */
  async getOne(idOrNumber: string): Promise<Order> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.get<{ data: BackendOrder }>(`/orders/${realId}`)
    idByOrderNumber.set(res.data.data.orderNumber, res.data.data.id)
    return mapOrder(res.data.data)
  },

  async cancel(idOrNumber: string, reason?: string): Promise<Order> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.post<{ data: BackendOrder }>(`/orders/${realId}/cancel`, { reason })
    return mapOrder(res.data.data)
  },
}
