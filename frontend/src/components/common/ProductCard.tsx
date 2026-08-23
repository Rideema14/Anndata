import { Link, useNavigate } from 'react-router-dom'
import { Heart, Sprout, Star, ShoppingCart } from 'lucide-react'

import type { Product } from '@/types'
import { useCart } from '@/context/CartContext'
import { useWishlist } from '@/context/WishlistContext'
import { useAuth } from '@/context/AuthContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const wishlisted = isWishlisted(product.id)
  const image = product.images?.[0]

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

  return (
    <article
      className="
        group
        relative
        flex
        h-[330px]
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
          {discountPercent > 0 && (
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
          CART BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          requireAuth(() => addToCart(product.id))
        }
        disabled={product.stock === 0}
        className="
          mt-auto
          flex
          h-[34px]
          w-full
          shrink-0
          items-center
          justify-center
          gap-1.5
          rounded-lg
          border
          border-[#D3DEC9]
          bg-[#F0F5EC]
          px-2
          text-[10.5px]
          font-bold
          text-[#3D5535]
          transition-all
          duration-200
          hover:border-[#B9C9B0]
          hover:bg-[#E5EEE0]
          disabled:border-[#E1E3DE]
          disabled:bg-[#F2F3F0]
          disabled:text-[#969C92]
        "
      >
        <ShoppingCart
          className="h-3.5 w-3.5 shrink-0"
          strokeWidth={2.2}
        />

        <span className="truncate">
          {product.stock === 0
            ? 'Out of stock'
            : 'Add to Cart'}
        </span>
      </button>
    </article>
  )
}