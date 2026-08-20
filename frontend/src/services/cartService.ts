import { api } from './api'
import type { CartLine } from '@/types'

interface BackendCartItem {
  id: string
  productId: string
  variantId?: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
  product: {
    id: string
    name: string
    slug: string
    price: number | string
    discountPrice?: number | string | null
    stock: number
    isActive: boolean
    images: { url: string }[]
  }
  variant?: { id: string; name: string } | null
}
interface BackendCart {
  id: string
  items: BackendCartItem[]
  subtotal: number
}

export interface Cart {
  lines: CartLine[]
  subtotal: number
}

/**
 * `savedForLater` has no backend equivalent (see Prisma schema — CartItem has
 * no such flag), so it's tracked client-side only, layered on top of the
 * real cart lines by CartContext. This adapter always returns `false`; the
 * context is responsible for merging in the local overlay.
 */
function mapItem(item: BackendCartItem): CartLine {
  return {
    productId: item.productId,
    quantity: item.quantity,
    savedForLater: false,
    itemId: item.id,
    variantId: item.variantId ?? undefined,
    variantName: item.variant?.name,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.product.discountPrice ?? item.product.price),
      discountPrice: item.product.discountPrice ? Number(item.product.discountPrice) : undefined,
      imageUrl: item.product.images?.[0]?.url,
      stock: item.product.stock,
    },
  }
}

function mapCart(c: BackendCart): Cart {
  return { lines: c.items.map(mapItem), subtotal: c.subtotal }
}

export const cartService = {
  async get(): Promise<Cart> {
    const res = await api.get<{ data: BackendCart }>('/cart')
    return mapCart(res.data.data)
  },

  async addItem(productId: string, quantity = 1, variantId?: string): Promise<Cart> {
    const res = await api.post<{ data: BackendCart }>('/cart/items', { productId, variantId, quantity })
    return mapCart(res.data.data)
  },

  async updateQuantity(itemId: string, quantity: number): Promise<Cart> {
    const res = await api.patch<{ data: BackendCart }>(`/cart/items/${itemId}`, { quantity })
    return mapCart(res.data.data)
  },

  async removeItem(itemId: string): Promise<Cart> {
    const res = await api.delete<{ data: BackendCart }>(`/cart/items/${itemId}`)
    return mapCart(res.data.data)
  },

  async clear(): Promise<Cart> {
    const res = await api.delete<{ data: BackendCart }>('/cart')
    return mapCart(res.data.data)
  },
}
