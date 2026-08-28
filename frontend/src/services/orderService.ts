import { api } from './api'
import type { Carrier, Order, OrderItem, OrderStatus, OrderSummary, ShipmentEvent } from '@/types'
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
  updatedAt: string
  items: BackendOrderItem[]
  address: BackendAddress
  payment?: BackendPayment | null
  trackingCarrier?: string | null
  trackingNumber?: string | null
  /** The buyer who placed the order. Present on every order, but only
   *  relevant to sellers/admins viewing the fulfillment list. */
  user?: { id: string; name: string }
}

function formatAddress(a: BackendAddress): string {
  return [a.addressLine1, a.addressLine2, a.city, a.state].filter(Boolean).join(', ') + ` – ${a.postalCode}`
}

function mapItem(i: BackendOrderItem): OrderItem {
  return { productId: i.productId, name: i.productName, quantity: i.quantity, price: Number(i.unitPrice) }
}

export function buildTrackingUrl(carrier?: string | null, number?: string | null): string | undefined {
  if (!carrier || !number) return undefined
  if (number.startsWith('http://') || number.startsWith('https://')) return number
  if (carrier.startsWith('http://') || carrier.startsWith('https://')) return carrier

  const norm = carrier.toUpperCase().replace(/\s+/g, '_')
  const enc = encodeURIComponent(number)

  if (norm.includes('DELHIVERY')) return `https://www.delhivery.com/tracking?uniqueIdentifier=${enc}`
  if (norm.includes('BLUEDART')) return `https://www.bluedart.com/tracking/${enc}`
  if (norm.includes('DTDC')) return `https://www.dtdc.in/tracking.asp?strCnno=${enc}`
  if (norm.includes('INDIA_POST') || norm.includes('SPEED_POST')) return `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?TrackConsignmentID=${enc}`
  if (norm.includes('EKART')) return `https://ekartlogistics.com/track/${enc}`
  if (norm.includes('XPRESSBEES')) return `https://www.xpressbees.com/shipment/tracking?awb=${enc}`
  if (norm.includes('SHADOWFAX')) return `https://tracker.shadowfax.in/#/track/${enc}`
  if (norm.includes('ECOM_EXPRESS')) return `https://www.ecomexpress.in/tracking/?awb_field=${enc}`
  if (norm.includes('PROFESSIONAL')) return `https://www.tpcindia.com/track.aspx?id=${enc}`

  return undefined
}

function mapOrder(o: BackendOrder): Order {
  const trackingNumber = o.trackingNumber ?? undefined
  const trackingCarrier = o.trackingCarrier ?? undefined
  const trackingUrl = buildTrackingUrl(trackingCarrier, trackingNumber)
  return {
    id: o.orderNumber,
    items: o.items.map(mapItem),
    total: Number(o.totalAmount),
    status: STATUS_MAP[o.status],
    placedAt: o.createdAt,
    updatedAt: o.updatedAt,
    address: formatAddress(o.address),
    paymentMethod: o.payment ? 'Razorpay' : 'Pending',
    trackingCarrier,
    trackingNumber,
    trackingUrl,
  }
}

function mapSummary(o: BackendOrder): OrderSummary {
  const label = o.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')
  const itemsSubtotal = o.items.reduce((sum, i) => sum + Number(i.totalPrice), 0)
  return {
    id: o.orderNumber,
    itemsLabel: label,
    total: Number(o.totalAmount),
    itemsSubtotal,
    status: STATUS_MAP[o.status],
    placedAt: o.createdAt,
    updatedAt: o.updatedAt,
    buyerName: o.user?.name,
  }
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

  async list(params: { page?: number; limit?: number; status?: BackendStatus; scope?: 'mine' | 'selling' } = {}): Promise<{
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

  async getTracking(idOrNumber: string): Promise<ShipmentEvent[]> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.get<{ data: ShipmentEvent[] }>(`/orders/${realId}/tracking`)
    return res.data.data
  },

  async getCarriers(): Promise<Carrier[]> {
    const res = await api.get<{ data: Carrier[] }>('/orders/carriers')
    return res.data.data
  },

  async cancel(idOrNumber: string, reason?: string): Promise<Order> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.post<{ data: BackendOrder }>(`/orders/${realId}/cancel`, { reason })
    return mapOrder(res.data.data)
  },

  /** Seller/admin only — advances an order's fulfillment status. */
  async updateStatus(
    idOrNumber: string,
    status: OrderStatus,
    note?: string,
    tracking?: { carrier: string; number: string },
  ): Promise<OrderSummary> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.patch<{ data: BackendOrder }>(`/orders/${realId}/status`, {
      status: REVERSE_STATUS_MAP[status],
      note,
      trackingCarrier: tracking?.carrier,
      trackingNumber: tracking?.number,
    })
    idByOrderNumber.set(res.data.data.orderNumber, res.data.data.id)
    return mapSummary(res.data.data)
  },
}