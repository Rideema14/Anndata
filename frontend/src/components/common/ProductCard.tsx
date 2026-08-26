import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Minus, Plus, Sprout, Star } from 'lucide-react'

import type { Product } from '@/types'
import { useWishlist } from '@/context/WishlistContext'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { quantityOf, addToCart, setQuantity, removeFromCart } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Tracks only "we just fired the very first add" so a second click before
  // the cart line exists yet can't double-fire addToCart. Everything after
  // that reads/writes the real cart quantity, which already updates
  // instantly (see CartContext's optimistic updates).
  const [justAdded, setJustAdded] = useState(false)

  const wishlisted = isWishlisted(product.id)
  const image = product.images?.[0]
  const cartQuantity = quantityOf(product.id)
  const inCart = cartQuantity > 0 || justAdded
  const outOfStock = product.stock === 0

  const discountPercent =
    product.originalPrice &&
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) /
            product.originalPrice) *
            100,
        )
      : 0

  function requireAuth(action: () => void) {
    if (!isAuthenticated) {
      navigate(
        `/login?next=${encodeURIComponent(window.location.pathname)}`,
      )
      return
    }

    action()
  }

  function handleAdd() {
    requireAuth(() => {
      // Only the very first tap calls addToCart — CartContext shows it in
      // the cart immediately, so we flip to the stepper right away rather
      // than waiting on the network. Every tap after that just adjusts the
      // existing line's quantity.
      setJustAdded(true)
      void addToCart(product, 1)
    })
  }

  function handleIncrement() {
    requireAuth(() => setQuantity(product.id, cartQuantity + 1))
  }

  function handleDecrement() {
    requireAuth(() => {
      if (cartQuantity <= 1) {
        setJustAdded(false)
        void removeFromCart(product.id)
      } else {
        setQuantity(product.id, cartQuantity - 1)
      }
    })
  }

  return (
    <article
      className="
        group
        relative
        flex
        h-[328px]
        w-full
        min-w-0
        flex-col
        overflow-hidden
        rounded-xl
        border
        border-[#E1E4DC]
        bg-white
        p-2.5
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-[#C9D2BF]
        hover:shadow-[0_8px_24px_rgba(30,45,24,0.09)]
      "
    >
      {/* =====================================================
          IMAGE
      ====================================================== */}

      <Link
        to={`/product/${product.slug ?? product.id}`}
        className="block w-full shrink-0"
      >
        <div
          className="
            relative
            h-[150px]
            w-full
            overflow-hidden
            rounded-lg
            bg-[#F3F5EF]
          "
        >
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-300
                group-hover:scale-[1.025]
              "
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Sprout
                className="h-9 w-9 text-[#82916D]"
                strokeWidth={1.4}
                aria-hidden="true"
              />
            </div>
          )}

          {/* ONLY render when discount exists */}
          {discountPercent > 0 && product.stock !== 0 && (
            <span
              className="
                absolute
                left-2
                top-2
                rounded-md
                bg-[#D92D20]
                px-1.5
                py-1
                text-[9px]
                font-extrabold
                leading-none
                text-white
              "
            >
              {discountPercent}% OFF
            </span>
          )}

          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-md bg-white/95 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-[#3D3D3D]">
                Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* =====================================================
          WISHLIST
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          requireAuth(() => toggleWishlist(product.id))
        }
        aria-pressed={wishlisted}
        aria-label={
          wishlisted
            ? 'Remove from wishlist'
            : 'Add to wishlist'
        }
        className="
          absolute
          right-4
          top-4
          z-20
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          border-[#E2E5DE]
          bg-white
          shadow-sm
          transition-all
          duration-200
          hover:border-[#C8D0C0]
          hover:bg-[#F8F9F6]
        "
      >
        <Heart
          className={cn(
            'h-3.5 w-3.5',
            wishlisted
              ? 'fill-[#D92D20] text-[#D92D20]'
              : 'text-[#687260]',
          )}
          aria-hidden="true"
        />
      </button>

      {/* =====================================================
          PRODUCT INFORMATION
      ====================================================== */}

      <Link
        to={`/product/${product.slug ?? product.id}`}
        className="flex min-h-0 w-full flex-1 flex-col"
      >
        {/* NAME */}
        <div className="mt-2 h-[34px] w-full overflow-hidden">
          <p
            className="
              line-clamp-2
              w-full
              text-[12px]
              font-semibold
              leading-[17px]
              text-[#20291C]
            "
          >
            {product.name}
          </p>
        </div>

        {/* RATING */}
        <div
          className="
            mt-2
            flex
            h-[18px]
            w-full
            min-w-0
            items-center
            overflow-hidden
            whitespace-nowrap
            text-[10px]
            text-[#737A6D]
          "
        >
          <span
            className="
              inline-flex
              h-[18px]
              shrink-0
              items-center
              gap-0.5
              rounded
              bg-[#F3F6EF]
              px-1.5
              font-bold
              text-[#46543D]
            "
          >
            <Star
              className="h-2.5 w-2.5 fill-[#D3A62A] text-[#D3A62A]"
            />

            {typeof product.rating === 'number'
              ? product.rating.toFixed(1)
              : product.rating}
          </span>

          <span className="ml-1 shrink-0">
            ({product.reviewCount})
          </span>

          {product.location && (
            <>
              <span className="mx-1 shrink-0 text-[#B5BAAF]">
                •
              </span>

              <span className="min-w-0 truncate">
                {product.location}
              </span>
            </>
          )}
        </div>

        {/* PRICE */}
        <div
          className="
            mt-2
            flex
            h-[24px]
            w-full
            min-w-0
            items-center
            overflow-hidden
            whitespace-nowrap
          "
        >
          <span
            className="
              shrink-0
              text-[15px]
              font-extrabold
              tracking-[-0.02em]
              text-[#182012]
            "
          >
            {formatINR(product.price)}
          </span>

          {product.originalPrice &&
            product.originalPrice > product.price && (
              <span
                className="
                  ml-1.5
                  shrink-0
                  text-[10px]
                  font-medium
                  text-[#999F94]
                  line-through
                "
              >
                {formatINR(product.originalPrice)}
              </span>
            )}

          <span
            className="
              ml-1
              shrink-0
              text-[10px]
              font-medium
              text-[#858C80]
            "
          >
            / {product.unit}
          </span>
        </div>
      </Link>

      {/* =====================================================
          QUICK ADD TO CART
      ====================================================== */}

      {!outOfStock && (
        <div className="mt-2 w-full shrink-0">
          {inCart ? (
            <div
              className="
                flex
                h-8
                w-full
                items-center
                justify-between
                overflow-hidden
                rounded-lg
                border
                border-[#C9D2BF]
                bg-[#F3F6EF]
              "
            >
              <button
                type="button"
                onClick={handleDecrement}
                aria-label="Decrease quantity"
                className="
                  flex
                  h-full
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  text-[#46543D]
                  transition-colors
                  hover:bg-[#E6EBDD]
                "
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <span className="text-[12px] font-extrabold text-[#20291C]">
                {cartQuantity || 1}
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={cartQuantity >= product.stock}
                aria-label="Increase quantity"
                className="
                  flex
                  h-full
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  text-[#46543D]
                  transition-colors
                  hover:bg-[#E6EBDD]
                  disabled:opacity-30
                "
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="
                flex
                h-8
                w-full
                items-center
                justify-center
                gap-1.5
                rounded-lg
                border
                border-[#20291C]
                bg-[#20291C]
                text-[11px]
                font-extrabold
                uppercase
                tracking-wide
                text-white
                transition-colors
                hover:bg-[#324029]
              "
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          )}
        </div>
      )}
    </article>
  )
})