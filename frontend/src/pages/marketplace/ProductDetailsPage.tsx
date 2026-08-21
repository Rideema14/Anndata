import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, Heart, PackageX, Sprout, Star, Store } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { productService } from '@/services/productService'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { formatINR, formatDateLabel } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Product, ProductReview } from '@/types'

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()

  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setIsLoading(true)
    setNotFound(false)
    setActiveImage(0)
    setSelectedVariant(null)
    setQuantity(1)

    productService
      .getBySlug(id)
      .then((result) => {
        if (cancelled) return
        setProduct(result)
        setSelectedVariant(result.variantOptions?.[0]?.id ?? null)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    productService
      .listReviews(id)
      .then((result) => {
        if (!cancelled) setReviews(result)
      })
      .catch(() => {
        if (!cancelled) setReviews([])
      })

    return () => {
      cancelled = true
    }
  }, [id])

  function requireAuth(action: () => void) {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    action()
  }

  async function handleAddToCart() {
    if (!product) return
    setIsAdding(true)
    try {
      await addToCart(product.id, quantity, selectedVariant ?? undefined)
      setAdded(true)
      window.setTimeout(() => setAdded(false), 2000)
    } finally {
      setIsAdding(false)
    }
  }

  async function handleBuyNow() {
    if (!product) return
    setIsAdding(true)
    try {
      await addToCart(product.id, quantity, selectedVariant ?? undefined)
      navigate('/checkout')
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6">
        <p className="text-sm text-ink-400">{t('common.loading')}</p>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <PackageX className="mx-auto mb-3 h-10 w-10 text-ink-300" aria-hidden="true" />
        <p className="text-sm font-semibold text-ink-900">{t('product.notFound')}</p>
        <p className="mt-1 text-xs text-ink-500">{t('product.notFoundDesc')}</p>
        <Link to="/market" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline">
          {t('product.backToMarketplace')}
        </Link>
      </div>
    )
  }

  const wishlisted = isWishlisted(product.id)
  const images = product.images ?? []
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0
  const activeVariant = product.variantOptions?.find((v) => v.id === selectedVariant)
  const effectivePrice = activeVariant?.price ?? product.price
  const effectiveStock = activeVariant?.stock ?? product.stock
  const outOfStock = effectiveStock === 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <Link to="/market" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t('product.backToMarketplace')}
      </Link>

      <div className="relative mb-3 flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-surface-sunk md:h-72">
        {discountPercent > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-danger-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {discountPercent}% {t('product.offBadge')}
          </span>
        )}
        <button
          type="button"
          onClick={() => requireAuth(() => toggleWishlist(product.id))}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? t('product.removeFromWishlist') : t('product.addToWishlist')}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 shadow-card"
        >
          <Heart className={cn('h-4 w-4', wishlisted ? 'fill-danger-500 text-danger-500' : 'text-ink-400')} aria-hidden="true" />
        </button>
        {images.length > 0 ? (
          <img src={images[activeImage]} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-ink-300">
            <Sprout className="h-16 w-16" strokeWidth={1.3} aria-hidden="true" />
            <span className="text-xs">{t('product.noImageAvailable')}</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              onClick={() => setActiveImage(idx)}
              className={cn(
                'h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2',
                idx === activeImage ? 'border-brand-500' : 'border-transparent',
              )}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <h1 className="text-xl">{product.name}</h1>
      <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
        <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
        {product.rating} {t('product.reviewsCount', { count: product.reviewCount })}
        {product.location ? ` · ${product.location}` : ''}
      </p>

      <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
        <Store className="h-3.5 w-3.5" aria-hidden="true" />
        {t('product.soldBy')} {product.sellerName || t('product.verifiedSeller')}
      </p>

      <p className="mt-3 flex items-baseline gap-2 text-2xl font-bold text-ink-900">
        {formatINR(effectivePrice)}
        <span className="text-xs font-normal text-ink-400">/ {product.unit}</span>
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="text-sm font-normal text-ink-400 line-through">{formatINR(product.originalPrice)}</span>
        )}
      </p>

      <p className={cn('mt-1 text-xs font-medium', outOfStock ? 'text-danger-500' : 'text-brand-600')}>
        {outOfStock ? t('product.outOfStock') : `${t('product.inStock')} · ${effectiveStock} ${t('product.available')}`}
      </p>

      {product.variantOptions && product.variantOptions.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-ink-700">{t('product.packSize')}</p>
          <div className="flex flex-wrap gap-2">
            {product.variantOptions.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariant(variant.id)}
                disabled={variant.stock === 0}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  variant.id === selectedVariant
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-ink-200 text-ink-600 hover:border-brand-300',
                )}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <p className="text-xs font-semibold text-ink-700">{t('product.quantity')}</p>
        <div className="flex items-center gap-3 rounded-full border border-ink-200 px-3 py-1.5">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="text-sm font-bold text-ink-600 disabled:opacity-30"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-5 text-center text-sm font-semibold text-ink-900">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(effectiveStock || q + 1, q + 1))}
            className="text-sm font-bold text-ink-600 disabled:opacity-30"
            disabled={outOfStock || quantity >= effectiveStock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        <Button
          variant="secondary"
          fullWidth
          disabled={outOfStock || isAdding}
          loading={isAdding && !added}
          onClick={() => requireAuth(handleAddToCart)}
        >
          {added ? (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {t('product.added')}
            </>
          ) : (
            'Add to Cart'
          )}
        </Button>
        <Button fullWidth disabled={outOfStock || isAdding} onClick={() => requireAuth(handleBuyNow)}>
          Buy Now
        </Button>
      </div>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-ink-900">{t('product.description')}</h2>
        <p className="text-sm leading-relaxed text-ink-600">
          {product.description || t('product.noDescriptionAvailable')}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink-900">{t('product.specifications')}</h2>
        {product.specifications.length > 0 ? (
          <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100">
            {product.specifications.map((spec) => (
              <div key={spec.label} className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-ink-500">{spec.label}</span>
                <span className="font-medium text-ink-900">{spec.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-400">{t('product.noSpecifications')}</p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-ink-900">{t('product.reviews')}</h2>
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-ink-100 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink-900">{review.author}</p>
                  <p className="text-[11px] text-ink-400">{formatDateLabel(review.date)}</p>
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-gold-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={cn('h-3 w-3', idx < review.rating ? 'fill-gold-400 text-gold-400' : 'text-ink-200')}
                      aria-hidden="true"
                    />
                  ))}
                </p>
                {review.comment && <p className="mt-1.5 text-xs text-ink-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-400">{t('product.noReviews')}</p>
        )}
      </section>
    </div>
  )
}
