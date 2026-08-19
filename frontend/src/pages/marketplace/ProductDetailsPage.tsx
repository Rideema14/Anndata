import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronLeft,
  Heart,
  MapPin,
  Minus,
  Plus,
  Star,
  Store,
} from 'lucide-react'

import { Button } from '@/components/common/Button'
import { getProductById } from '@/data/mock/mockProductCatalog'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useLanguage } from '@/context/LanguageContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const product = getProductById(id ?? '')

  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { t } = useLanguage()

  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  /*
   * ---------------------------------------------------------
   * PRODUCT NOT FOUND
   * ---------------------------------------------------------
   */

  if (!product) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center justify-center px-6">
        <div className="w-full rounded-3xl border border-[#ddd6c6] bg-[#fffdf7] p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#292c23]">
            Product not found
          </h1>

          <p className="mt-2 text-sm text-[#777265]">
            The product you are looking for does not exist or may have
            been removed.
          </p>

          <Link
            to="/market"
            className="mt-5 inline-flex rounded-full bg-[#5c744d] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#4d633f]"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    )
  }

  // Capture the narrowed value for use inside event handlers.
  const productId = product.id

  /*
   * ---------------------------------------------------------
   * SAFE DATA
   * ---------------------------------------------------------
   */

  const variants = product.variants ?? []
  const specifications = product.specifications ?? []
  const reviews = product.reviews ?? []

  const selectedVariant =
    variants.length > 0 ? variants[variants.length - 1] : product.unit

  const [variant, setVariant] = useState(selectedVariant)

  const wishlisted = isWishlisted(product.id)

  /*
   * ---------------------------------------------------------
   * CART
   * ---------------------------------------------------------
   */

  function handleAddToCart() {
    addToCart(productId, quantity)

    setJustAdded(true)

    window.setTimeout(() => {
      setJustAdded(false)
    }, 2000)
  }

  function handleBuyNow() {
    addToCart(productId, quantity)
    navigate('/cart')
  }

  /*
   * ---------------------------------------------------------
   * BACK
   * ---------------------------------------------------------
   */

  function handleBack() {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-[#f4f0e6] px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">

        {/* =====================================================
            BACK BUTTON
        ===================================================== */}

        <button
          type="button"
          onClick={handleBack}
          className="mb-5 flex items-center gap-1.5 text-xs font-bold text-[#5c744d] transition hover:text-[#3f5935]"
        >
          <ChevronLeft className="h-4 w-4" />

          {t('common.back')}
        </button>


        {/* =====================================================
            MAIN PRODUCT
        ===================================================== */}

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">

          {/* ===================================================
              PRODUCT IMAGE
          =================================================== */}

          <div className="overflow-hidden rounded-[28px] border border-[#ddd6c6] bg-[#fffdf7] p-3 shadow-sm">

            <div className="group relative h-[360px] overflow-hidden rounded-[22px] bg-[#e7e2d5] md:h-[480px]">

              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-sm font-medium text-[#8d877a]">
                    No image available
                  </span>
                </div>
              )}

              {/* IMAGE OVERLAY */}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />


              {/* CATEGORY */}

              <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#557347] shadow-sm backdrop-blur">
                {product.category}
              </div>


              {/* RATING */}

              <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#403e36] shadow-sm backdrop-blur">

                <Star
                  className="h-3.5 w-3.5 fill-[#b79c36] text-[#b79c36]"
                />

                {product.rating}
              </div>

            </div>

          </div>


          {/* ===================================================
              PRODUCT INFORMATION
          =================================================== */}

          <div className="rounded-[28px] border border-[#ddd6c6] bg-[#fffdf7] p-5 shadow-sm md:p-7">

            {/* CATEGORY */}

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#928a7c]">
              {product.category}
            </p>


            {/* TITLE */}

            <h1 className="mt-2 text-2xl font-black leading-tight tracking-[-0.035em] text-[#292c23] md:text-3xl">
              {product.name}
            </h1>


            {/* LOCATION + RATING */}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#777265]">

              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 fill-[#b79c36] text-[#b79c36]" />

                <span className="font-bold text-[#403e36]">
                  {product.rating}
                </span>

                <span>
                  ({product.reviewCount ?? reviews.length} reviews)
                </span>
              </span>


              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />

                {product.location}
              </span>

            </div>


            {/* PRICE */}

            <div className="mt-6 flex items-end gap-2">

              <span className="text-3xl font-black tracking-[-0.04em] text-[#292c23]">
                {formatINR(product.price)}
              </span>

              <span className="mb-1 text-xs text-[#888274]">
                / {variant || product.unit}
              </span>

            </div>


            {/* SELLER */}

            <div className="mt-3 flex items-center gap-2 text-xs text-[#777265]">

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6ecdf]">
                <Store className="h-4 w-4 text-[#5c744d]" />
              </div>

              <span>
                Sold by{' '}
                <strong className="text-[#403e36]">
                  {product.sellerName}
                </strong>
              </span>

            </div>


            {/* STOCK */}

            <div className="mt-4">

              <span
                className={cn(
                  'inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider',
                  product.stock > 0
                    ? 'bg-[#e2eadb] text-[#557347]'
                    : 'bg-[#f0ddd7] text-[#8a513d]',
                )}
              >
                {product.stock > 0
                  ? `In stock · ${product.stock} available`
                  : 'Out of stock'}
              </span>

            </div>


            {/* =================================================
                VARIANTS
            ================================================= */}

            {variants.length > 0 && (
              <div className="mt-6">

                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#777265]">
                  Pack size
                </p>

                <div className="flex flex-wrap gap-2">

                  {variants.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setVariant(item)}
                      className={cn(
                        'rounded-full border px-4 py-2 text-xs font-bold transition',
                        variant === item
                          ? 'border-[#5c744d] bg-[#e2eadb] text-[#557347]'
                          : 'border-[#d8d0bf] bg-white text-[#777265] hover:border-[#9cac8f]',
                      )}
                    >
                      {item}
                    </button>
                  ))}

                </div>

              </div>
            )}


            {/* =================================================
                QUANTITY
            ================================================= */}

            <div className="mt-6 flex items-center gap-4">

              <p className="text-xs font-bold uppercase tracking-wider text-[#777265]">
                Quantity
              </p>

              <div className="flex items-center overflow-hidden rounded-full border border-[#d8d0bf] bg-white">

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.max(1, current - 1),
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center text-[#777265] transition hover:bg-[#f2eee4] hover:text-[#5c744d]"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="w-10 text-center text-sm font-black text-[#292c23]">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => current + 1)
                  }
                  className="flex h-10 w-10 items-center justify-center text-[#777265] transition hover:bg-[#f2eee4] hover:text-[#5c744d]"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>

              </div>

            </div>


            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="mt-6 grid grid-cols-[1fr_1fr_auto] gap-2">

              <Button
                variant="secondary"
                fullWidth
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {justAdded ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Added
                  </span>
                ) : (
                  t('common.addToCart')
                )}
              </Button>


              <Button
                fullWidth
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                {t('common.buyNow')}
              </Button>


              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-pressed={wishlisted}
                aria-label={
                  wishlisted
                    ? 'Remove from wishlist'
                    : 'Add to wishlist'
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8d0bf] bg-white transition hover:bg-[#f2eee4]"
              >
                <Heart
                  className={cn(
                    'h-5 w-5',
                    wishlisted
                      ? 'fill-[#b65d4b] text-[#b65d4b]'
                      : 'text-[#777265]',
                  )}
                />
              </button>

            </div>

          </div>

        </div>


        {/* =====================================================
            DESCRIPTION
        ===================================================== */}

        <section className="mt-6 rounded-[24px] border border-[#ddd6c6] bg-[#fffdf7] p-5 md:p-6">

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#928a7c]">
            Product information
          </p>

          <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#292c23]">
            Description
          </h2>

          <p className="mt-3 max-w-4xl text-sm leading-7 text-[#777265]">
            {product.description ||
              'No description available for this product.'}
          </p>

        </section>


        {/* =====================================================
            SPECIFICATIONS
        ===================================================== */}

        <section className="mt-5 rounded-[24px] border border-[#ddd6c6] bg-[#fffdf7] p-5 md:p-6">

          <h2 className="text-xl font-black tracking-[-0.03em] text-[#292c23]">
            Specifications
          </h2>

          {specifications.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#e2dccf]">

              {specifications.map((spec, index) => (
                <div
                  key={`${spec.label}-${index}`}
                  className="flex flex-col gap-1 border-b border-[#e8e2d7] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-xs font-medium text-[#888274]">
                    {spec.label}
                  </span>

                  <span className="text-sm font-bold text-[#403e36]">
                    {spec.value}
                  </span>
                </div>
              ))}

            </div>
          ) : (
            <p className="mt-3 text-sm text-[#888274]">
              No specifications available.
            </p>
          )}

        </section>


        {/* =====================================================
            REVIEWS
        ===================================================== */}

        <section className="mb-8 mt-5 rounded-[24px] border border-[#ddd6c6] bg-[#fffdf7] p-5 md:p-6">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#928a7c]">
                Customer feedback
              </p>

              <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[#292c23]">
                Reviews
              </h2>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-[#f1e6bb] px-3 py-1.5 text-xs font-bold text-[#786321]">

              <Star className="h-3.5 w-3.5 fill-[#b79c36] text-[#b79c36]" />

              {product.rating}

            </div>

          </div>


          {reviews.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">

              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-[#e2dccf] bg-[#faf7ef] p-4"
                >

                  <div className="flex items-center justify-between">

                    <p className="text-sm font-bold text-[#403e36]">
                      {review.author}
                    </p>

                    <span className="flex items-center gap-1 text-xs font-bold text-[#786321]">

                      <Star className="h-3.5 w-3.5 fill-[#b79c36] text-[#b79c36]" />

                      {review.rating}

                    </span>

                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#777265]">
                    {review.comment}
                  </p>

                </div>
              ))}

            </div>
          ) : (
            <p className="mt-4 text-sm text-[#888274]">
              No reviews yet.
            </p>
          )}

        </section>

      </div>
    </div>
  )
}