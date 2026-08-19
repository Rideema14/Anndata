import { Link } from 'react-router-dom'
import { Heart, Sprout, Star } from 'lucide-react'
import type { Product } from '@/types'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { getDiscountPercent } from '@/data/mock/mockProductCatalog'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const wishlisted = isWishlisted(product.id)
  const discountPercent = getDiscountPercent(product)

  return (
    <div className="group relative rounded-2xl border border-ink-100 bg-surface p-3 transition-shadow hover:shadow-card">
      {discountPercent && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-danger-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {discountPercent}% OFF
        </span>
      )}
      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 shadow-card"
      >
        <Heart className={cn('h-3.5 w-3.5', wishlisted ? 'fill-danger-500 text-danger-500' : 'text-ink-400')} aria-hidden="true" />
      </button>

      <Link to={`/product/${product.id}`}>
        <div className="mb-2 flex h-24 items-center justify-center rounded-xl bg-surface-sunk">
          <Sprout className="h-8 w-8 text-brand-400" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <p className="line-clamp-2 text-xs font-medium leading-snug text-ink-900">{product.name}</p>
        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-500">
          <Star className="h-3 w-3 fill-gold-400 text-gold-400" aria-hidden="true" />
          {product.rating} ({product.reviewCount}) · {product.location}
        </div>
        <p className="mt-1 flex items-baseline gap-1.5 text-sm font-bold text-ink-900">
          {formatINR(product.price)}
          {product.originalPrice && (
            <span className="text-[11px] font-normal text-ink-400 line-through">{formatINR(product.originalPrice)}</span>
          )}
          <span className="text-[11px] font-normal text-ink-400">/ {product.unit}</span>
        </p>
      </Link>

      <button
        type="button"
        onClick={() => addToCart(product.id)}
        disabled={product.stock === 0}
        className="mt-2 w-full rounded-full bg-brand-50 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100 disabled:bg-surface-sunk disabled:text-ink-400"
      >
        {product.stock === 0 ? 'Out of stock' : 'Add to Cart'}
      </button>
    </div>
  )
}
