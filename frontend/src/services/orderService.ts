import { api } from './api'
import type { Carrier, Dispute, Order, OrderItem, OrderStatus, OrderSummary, SellerOrderDetail, Shipment, ShipmentEvent } from '@/types'
import type { PaginationMeta } from './productService'

type BackendStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'DISPUTED'

const STATUS_MAP: Record<BackendStatus, OrderStatus> = {
  PENDING: 'placed',
  CONFIRMED: 'confirmed',
  PROCESSING: 'packed',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  DISPUTED: 'disputed',
}

/** Reverse of STATUS_MAP — used only for the admin manual status-override UI, if wired up later. Sellers no longer have access to this endpoint at all (see submitShipment). */
export const REVERSE_STATUS_MAP: Record<OrderStatus, BackendStatus> = {
  placed: 'PENDING',
  confirmed: 'CONFIRMED',
  packed: 'PROCESSING',
  shipped: 'SHIPPED',
  out_for_delivery: 'OUT_FOR_DELIVERY',
  delivered: 'DELIVERED',
  cancelled: 'CANCELLED',
  returned: 'RETURNED',
  disputed: 'DISPUTED',
}

interface BackendOrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number | string
  totalPrice: number | string
  /** Only populated on the seller-detail endpoint (GET /orders/:id/seller-detail), which includes each product's primary photo. */
  product?: { images?: { url: string }[] }
}
interface BackendAddress {
  fullName: string
  phone: string
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
  method?: string | null
}
interface BackendShipmentEvent {
  id: string
  status: string
  description: string
  location: string | null
  eventTime: string
  source: string
}
type BackendShipmentStatus = 'AWB_SUBMITTED' | 'AWB_VERIFIED' | 'PICKUP_CONFIRMED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERY_FAILED' | 'RETURNED' | 'EXCEPTION'
interface BackendShipment {
  carrierCode: string
  carrierName?: string | null
  awb: string
  status: BackendShipmentStatus
  verified: boolean
  lastVerificationError?: string | null
  pickupConfirmedAt?: string | null
  deliveredAt?: string | null
  lastSyncedAt?: string | null
  flaggedForReview: boolean
  events?: BackendShipmentEvent[]
}
type BackendDisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'
interface BackendDispute {
  id: string
  reason: string
  details?: string | null
  status: BackendDisputeStatus
  adminNote?: string | null
  createdAt: string
}
interface BackendStatusHistoryEntry {
  status: BackendStatus
  changedAt: string
  note?: string | null
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
   *  relevant to sellers/admins viewing the fulfillment list/detail page.
   *  email/phone are only included on the detail endpoint. */
  user?: { id: string; name: string; email?: string; phone?: string | null }
  statusHistory?: BackendStatusHistoryEntry[]
  shipment?: BackendShipment | null
  disputes?: BackendDispute[]
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

function mapShipmentEvent(e: BackendShipmentEvent): ShipmentEvent {
  return { id: e.id, status: e.status, description: e.description, location: e.location, eventTime: e.eventTime, source: e.source }
}

function mapShipment(s: BackendShipment): Shipment {
  return {
    carrierCode: s.carrierCode,
    carrierName: s.carrierName ?? undefined,
    awb: s.awb,
    status: s.status,
    verified: s.verified,
    lastVerificationError: s.lastVerificationError ?? undefined,
    pickupConfirmedAt: s.pickupConfirmedAt ?? undefined,
    deliveredAt: s.deliveredAt ?? undefined,
    lastSyncedAt: s.lastSyncedAt ?? undefined,
    flaggedForReview: s.flaggedForReview,
    events: (s.events ?? []).map(mapShipmentEvent),
  }
}

function mapDispute(d: BackendDispute): Dispute {
  return { id: d.id, reason: d.reason, details: d.details ?? undefined, status: d.status, adminNote: d.adminNote ?? undefined, createdAt: d.createdAt }
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
    shipment: o.shipment ? mapShipment(o.shipment) : undefined,
    disputes: o.disputes?.map(mapDispute),
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
    shipment: o.shipment
      ? { carrierCode: o.shipment.carrierCode, awb: o.shipment.awb, status: o.shipment.status, verified: o.shipment.verified, flaggedForReview: o.shipment.flaggedForReview }
      : undefined,
  }
}

function mapSellerOrderDetail(o: BackendOrder): SellerOrderDetail {
  const trackingNumber = o.trackingNumber ?? undefined
  const trackingCarrier = o.trackingCarrier ?? undefined
  return {
    id: o.orderNumber,
    status: STATUS_MAP[o.status],
    placedAt: o.createdAt,
    updatedAt: o.updatedAt,
    items: o.items.map((i) => ({
      productId: i.productId,
      name: i.productName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
      totalPrice: Number(i.totalPrice),
      image: i.product?.images?.[0]?.url,
    })),
    subtotal: Number(o.subtotal),
    shippingFee: Number(o.shippingFee),
    tax: Number(o.tax),
    total: Number(o.totalAmount),
    address: {
      fullName: o.address.fullName,
      phone: o.address.phone,
      line1: o.address.addressLine1,
      line2: o.address.addressLine2 ?? undefined,
      city: o.address.city,
      state: o.address.state,
      pincode: o.address.postalCode,
    },
    customer: {
      id: o.user?.id ?? '',
      name: o.user?.name ?? 'Buyer',
      email: o.user?.email ?? '',
      phone: o.user?.phone ?? undefined,
    },
    paymentStatus: o.payment?.status,
    paymentMethod: o.payment?.method ?? undefined,
    trackingCarrier,
    trackingNumber,
    trackingUrl: buildTrackingUrl(trackingCarrier, trackingNumber),
    shipment: o.shipment ? mapShipment(o.shipment) : undefined,
    disputes: o.disputes?.map(mapDispute),
    statusHistory: (o.statusHistory ?? []).map((h) => ({
      status: STATUS_MAP[h.status],
      note: h.note ?? undefined,
      changedAt: h.changedAt,
    })),
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

  /** Seller/admin fulfillment view — items filtered server-side to just the requesting seller's own products. */
  async getSellerOrderDetail(idOrNumber: string): Promise<SellerOrderDetail> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.get<{ data: BackendOrder }>(`/orders/${realId}/seller-detail`)
    idByOrderNumber.set(res.data.data.orderNumber, res.data.data.id)
    return mapSellerOrderDetail(res.data.data)
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

  /**
   * Admin-only manual status override. Sellers no longer have access to
   * this endpoint at all — see submitShipment() below for their (courier-
   * verified) shipment submission flow instead.
   */
  async updateStatus(idOrNumber: string, status: OrderStatus, note?: string): Promise<OrderSummary> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.patch<{ data: BackendOrder }>(`/orders/${realId}/status`, {
      status: REVERSE_STATUS_MAP[status],
      note,
    })
    idByOrderNumber.set(res.data.data.orderNumber, res.data.data.id)
    return mapSummary(res.data.data)
  },

  /**
   * The seller's ENTIRE shipment-management surface: submit the AWB, get it
   * verified against the carrier. Every subsequent status change (pickup,
   * transit, delivery) comes exclusively from the courier afterward.
   */
  async submitShipment(idOrNumber: string, input: { carrierCode: string; awb: string; carrierName?: string }): Promise<Order> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.post<{ data: BackendOrder }>(`/orders/${realId}/shipment`, input)
    idByOrderNumber.set(res.data.data.orderNumber, res.data.data.id)
    return mapOrder(res.data.data)
  },

  async getShipment(idOrNumber: string): Promise<Shipment | null> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.get<{ data: BackendShipment | null }>(`/orders/${realId}/shipment`)
    return res.data.data ? mapShipment(res.data.data) : null
  },

  /** Buyer reports a delivery problem on a delivered order. */
  async createDispute(idOrNumber: string, reason: string, details?: string): Promise<Dispute> {
    const realId = idByOrderNumber.get(idOrNumber) ?? idOrNumber
    const res = await api.post<{ data: BackendDispute }>(`/orders/${realId}/dispute`, { reason, details })
    return mapDispute(res.data.data)
  },

  async listMyDisputes(): Promise<Dispute[]> {
    const res = await api.get<{ data: BackendDispute[] }>('/orders/disputes/mine')
    return res.data.data.map(mapDispute)
  },
}
