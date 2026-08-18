import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, Heart, MapPin, Minus, Plus, Sprout, Star, Store } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { getProductById } from '@/data/mock/mockProductCatalog'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useLanguage } from '@/context/LanguageContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const product = getProductById(id ?? '')
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { t } = useLanguage()
  const [quantity, setQuantity] = useState(1)
  const [variant, setVariant] = useState(product?.variants?.[product.variants.length - 1] ?? '')
  const [justAdded, setJustAdded] = useState(false)

  if (!product) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-sm text-ink-500">Product not found.</p>
        <Link to="/market" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Marketplace
        </Link>
      </div>
    )
  }

  function handleAddToCart() {
    addToCart(product!.id, quantity)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 2000)
  }

  function handleBuyNow() {
    addToCart(product!.id, quantity)
    navigate('/cart')
  }

  const wishlisted = isWishlisted(product.id)

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <Link to={`/market/${product.categorySlug}`} className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t('common.back')}
      </Link>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Gallery placeholder */}
        <div className="flex h-64 items-center justify-center rounded-2xl bg-surface-sunk md:h-80">
          <Sprout className="h-16 w-16 text-brand-400" strokeWidth={1.3} aria-hidden="true" />
        </div>

        <div>
          <h1 className="text-xl">{product.name}</h1>
          <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
              {product.rating} ({product.reviewCount} reviews)
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {product.location}
            </span>
          </div>

          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-ink-900">{formatINR(product.price)}</span>
            <span className="text-xs text-ink-400">/ {variant || product.unit}</span>
          </p>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            Sold by <span className="font-medium text-ink-700">{product.sellerName}</span>
          </p>

          <p
            className={cn(
              'mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
              product.stock > 0 ? 'bg-brand-50 text-brand-700' : 'bg-danger-50 text-danger-500',
            )}
          >
            {product.stock > 0 ? `In stock (${product.stock} available)` : 'Out of stock'}
          </p>

          {product.variants && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold text-ink-600">Pack size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium',
                      variant === v ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <p className="text-xs font-semibold text-ink-600">Quantity</p>
            <div className="flex items-center rounded-full border border-ink-200">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="flex h-9 w-9 items-center justify-center text-ink-600 hover:text-brand-600"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="flex h-9 w-9 items-center justify-center text-ink-600 hover:text-brand-600"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button variant="secondary" fullWidth onClick={handleAddToCart} disabled={product.stock === 0}>
              {justAdded ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Added
                </>
              ) : (
                t('common.addToCart')
              )}
            </Button>
            <Button fullWidth onClick={handleBuyNow} disabled={product.stock === 0}>
              {t('common.buyNow')}
            </Button>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-200"
            >
              <Heart className={cn('h-4.5 w-4.5', wishlisted ? 'fill-danger-500 text-danger-500' : 'text-ink-500')} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="mt-8">
        <h2 className="mb-2 text-base">Description</h2>
        <p className="text-sm leading-relaxed text-ink-600">{product.description}</p>
      </section>

      {/* Specifications */}
      <section className="mt-6">
        <h2 className="mb-2 text-base">Specifications</h2>
        <dl className="divide-y divide-ink-100 rounded-2xl border border-ink-100">
          {product.specifications.map((spec) => (
            <div key={spec.label} className="flex justify-between px-4 py-2.5 text-sm">
              <dt className="text-ink-500">{spec.label}</dt>
              <dd className="font-medium text-ink-900">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Reviews */}
      <section className="mt-6 mb-4">
        <h2 className="mb-2 text-base">Reviews</h2>
        <div className="space-y-3">
          {product.reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-ink-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink-900">{review.author}</p>
                <span className="flex items-center gap-1 text-xs text-gold-600">
                  <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
                  {review.rating}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-500">{review.comment}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
