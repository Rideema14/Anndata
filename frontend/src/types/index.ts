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
  | 'cancelled'
  | 'returned'
export type SellerOrderStatus = OrderStatus

export interface SellerOrder {
  id: string
  buyerName: string
  itemsLabel: string
  total: number
  status: SellerOrderStatus
  placedAt: string
  updatedAt: string
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

export interface Order {
  id: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  placedAt: string
  updatedAt: string
  address: string
  paymentMethod: string
}

export interface OrderSummary {
  id: string
  itemsLabel: string
  total: number
  status: OrderStatus
  placedAt: string
  updatedAt: string
  /** Name of the buyer who placed the order. Only meaningful to a seller/admin viewing their fulfillment list. */
  buyerName?: string
  /** Sum of just the caller's own line items — differs from `total` (the whole order's total) when other sellers' products share the same order. */
  itemsSubtotal?: number
}
