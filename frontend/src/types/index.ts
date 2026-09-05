/**
 * A single Aandata account can hold multiple roles at once. There is no
 * concept of a separate "seller account" — `roles` is just a set of
 * capabilities layered onto one user. `activeMode` is UI-only state (which
 * view is currently showing) and is completely independent of `roles`.
 */
export type UserRole = 'buyer' | 'seller' | 'admin'

export type SellerVerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

export interface Address {
  id: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
  /** Extra fields the real backend requires (`/users/me/addresses`) — optional so existing mock-built addresses still type-check. */
  fullName?: string
  phone?: string
  country?: string
  latitude?: number
  longitude?: number
}

export interface User {
  id: string
  name: string
  phone: string
  email?: string
  avatarUrl?: string
  location: string
  language: string
  roles: UserRole[]
  sellerVerification: SellerVerificationStatus
  addresses: Address[]
  createdAt: string
}

/**
 * Full session, held by AuthContext once real login/register/refresh succeeds.
 * accessToken/refreshToken are also persisted to localStorage by api.ts.
 */
export interface AuthSession {
  user: User
  accessToken: string
  refreshToken: string
}

export type AppMode = 'buy' | 'sell' | 'admin'

/**
 * Minimal shape used by Home page teasers today. The full Product type
 * (variants, specs, stock, reviews) is defined when the Marketplace module
 * is built out in Phase 3 — see docs/API_INTEGRATION.md once that lands.
 */
export interface ProductReview {
  id: string
  author: string
  rating: number
  comment: string
  date: string
}

export interface Product {
  id: string
  name: string
  categorySlug: string
  price: number
  /** Present when the item is a discounted "Top Deal" — original pre-discount price. */
  originalPrice?: number
  unit: string
  sellerId: string
  sellerName: string
  location: string
  rating: number
  reviewCount: number
  stock: number
  description: string
  specifications: { label: string; value: string }[]
  variants?: string[]
  reviews: ProductReview[]
  createdAt: string
  /** Backend-only fields — optional so existing mock Product literals keep type-checking. */
  slug?: string
  images?: string[]
  isWishlisted?: boolean
  isActive?: boolean
  variantOptions?: { id: string; name: string; price: number; stock: number }[]
}

export interface CartLine {
  productId: string
  quantity: number
  savedForLater: boolean
  /** Populated once the cart is backed by the real API — needed to PATCH/DELETE a specific line. */
  itemId?: string
  variantId?: string
  variantName?: string
  unitPrice?: number
  lineTotal?: number
  product?: {
    id: string
    name: string
    slug: string
    price: number
    discountPrice?: number
    imageUrl?: string
    stock: number
  }
}

export interface ProductSpecification {
  label: string
  value: string
}

/** Minimal shape used by Home page teasers (full Product above covers Marketplace/Phase 3 needs). */
export interface ProductSummary {
  id: string
  name: string
  category: string
  categorySlug: string

  price: number
  unit: string

  sellerName: string
  location: string

  rating: number
  reviewCount: number
  stock: number

  description: string
  image: string

  variants: string[]

  specifications: ProductSpecification[]
  reviews: ProductReview[]
}
export type ListingStatus = 'active' | 'pending' | 'inactive'

export interface Listing {
  id: string
  name: string
  categorySlug: string
  price: number
  unit: string
  stock: number
  status: ListingStatus
  createdAt: string
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'cancelled'
  | 'returned'
  | 'disputed'
export type SellerOrderStatus = OrderStatus

/**
 * Who ultimately receives an order's money — deliberately separate from
 * OrderStatus (fulfillment outcome) and payment status (gateway state). See
 * SellerOrderDetail/Order below for where this shows up, and
 * adminService.ts for the admin-only settlement-decision surface.
 */
export type SettlementStatus =
  | 'not_eligible'
  | 'pending_review'
  | 'seller_payout_pending'
  | 'seller_paid'
  | 'buyer_refund_pending'
  | 'buyer_refunded'

export interface SellerOrder {
  id: string
  buyerName: string
  itemsLabel: string
  total: number
  status: SellerOrderStatus
  placedAt: string
  updatedAt: string
  /** Undefined until the seller has submitted courier + AWB for this order. */
  shipment?: Pick<Shipment, 'carrierCode' | 'carrierName' | 'awb'>
}

export type AiHistoryType = 'crop_advisor' | 'disease' | 'soil' | 'fertilizer' | 'chat'

export interface AiHistoryEntry {
  id: string
  type: AiHistoryType
  title: string
  summary: string
  createdAt: string
}

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
}

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'

export interface Dispute {
  id: string
  reason: string
  details?: string
  status: DisputeStatus
  adminNote?: string
  createdAt: string
}

/**
 * The seller-submitted shipment record for an order — courier + AWB,
 * submitted exactly once. There is no third-party tracking integration
 * (17TRACK has been removed): `trackingUrl` is just the official courier
 * tracking page/deep-link built from `carrierCode`+`awb`, not a live
 * status. Delivery is confirmed manually by an admin via OrderStatus, not
 * anything on this object.
 */
export interface Shipment {
  carrierCode: string
  carrierName?: string
  awb: string
  shipmentDate?: string
  note?: string
  submittedAt: string
  /** Official courier tracking destination, built server-side (courier.config.ts) — undefined if the courier has no known tracking page. */
  trackingUrl?: string
  /** True if trackingUrl already has the AWB baked in; false means the buyer/admin still needs to paste the AWB in themselves on that page. */
  trackingUrlIsDirect?: boolean
}

export interface Carrier {
  code: string
  name: string
}

export interface Order {
  id: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  /** Undefined for older cached summaries that predate the settlement system — treat as 'not_eligible'. */
  settlementStatus?: SettlementStatus
  placedAt: string
  updatedAt: string
  address: string
  paymentMethod: string
  shipment?: Shipment
  disputes?: Dispute[]
}

export interface OrderSummary {
  id: string
  itemsLabel: string
  total: number
  status: OrderStatus
  settlementStatus?: SettlementStatus
  placedAt: string
  updatedAt: string
  /** Name of the buyer who placed the order. Only meaningful to a seller/admin viewing their fulfillment list. */
  buyerName?: string
  /** Sum of just the caller's own line items — differs from `total` (the whole order's total) when other sellers' products share the same order. */
  itemsSubtotal?: number
  /** Lightweight shipment info for the fulfillment list. */
  shipment?: Pick<Shipment, 'carrierCode' | 'carrierName' | 'awb'>
}

// --- Seller-facing order detail page ---------------------------------------
// Richer than `Order`/`OrderSummary` above (which are buyer-facing): includes
// structured delivery contact + account contact + status timeline, since a
// seller fulfilling an order needs all of that, not just a formatted address string.

export interface OrderDetailItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
  image?: string
}

export interface OrderStatusEvent {
  status: OrderStatus
  note?: string
  changedAt: string
}

export interface SellerOrderDetail {
  id: string
  status: OrderStatus
  settlementStatus?: SettlementStatus
  placedAt: string
  updatedAt: string
  items: OrderDetailItem[]
  subtotal: number
  shippingFee: number
  tax: number
  total: number
  /** Delivery contact + address, as entered on this specific order — may differ from the buyer's account phone. */
  address: {
    fullName: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  /** The buyer's account — for any follow-up beyond the delivery contact above. */
  customer: {
    id: string
    name: string
    email: string
    phone?: string
  }
  paymentStatus?: string
  paymentMethod?: string
  shipment?: Shipment
  disputes?: Dispute[]
  statusHistory: OrderStatusEvent[]
}

