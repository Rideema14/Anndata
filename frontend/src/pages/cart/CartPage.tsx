import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Minus,
  Plus,
  ShoppingCart,
  Sprout,
  Trash2,
  Truck,
} from 'lucide-react'

import { Button } from '@/components/common/Button'
import { useCart, getDeliveryFee } from '@/context/CartContext'
import { useLanguage } from '@/context/LanguageContext'
import { formatINR } from '@/utils/format'


/* =========================================================
   CART PAGE
========================================================= */

export default function CartPage() {
  const {
    lines,
    isLoading,
    removeFromCart,
    setQuantity,
    toggleSaveForLater,
    subtotal,
    itemCount,
  } = useCart()

  const navigate = useNavigate()
  const { t } = useLanguage()

  const activeLines = lines.filter((line) => !line.savedForLater)
  const savedLines = lines.filter((line) => line.savedForLater)

  const deliveryFee = getDeliveryFee(subtotal)
  const total = subtotal + deliveryFee

  /* =======================================================
     LOADING
  ======================================================= */

  if (isLoading && lines.length === 0) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center bg-[#F8F9F5]">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EEF1E6]">
            <ShoppingCart
              className="h-5 w-5 text-[#667744]"
              strokeWidth={1.8}
            />
          </div>

          <p className="mt-3 text-sm text-ink-400">
            {t('common.loading')}
          </p>
        </div>
      </div>
    )
  }

  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (lines.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#F8F9F5]">
        <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center">

          <div className="relative mb-7">
            <div className="flex h-24 w-24 items-center justify-center rounded-[30px] bg-[#EEF1E6]">
              <ShoppingCart
                className="h-10 w-10 text-[#667744]"
                strokeWidth={1.5}
              />
            </div>

            <div className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
              <Sprout
                className="h-4 w-4 text-[#667744]"
                strokeWidth={1.8}
              />
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {t('cart.emptyTitle')}
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-500">
            {t('cart.emptySubtitle')}
          </p>

          <Link
            to="/market"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-[#233307] px-6 text-sm font-semibold text-white transition hover:bg-[#4F5F32]"
          >
            {t('nav.market')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F8F9F5]">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="mb-8">
          <div className="flex items-end justify-between gap-4">

            <div>
            
              <h1 className="text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                {t('cart.title')}
              </h1>

              <p className="mt-1 text-sm text-ink-400">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>

            <Link
              to="/market"
              className="hidden items-center gap-2 text-sm font-medium text-ink-500 transition hover:text-[#667744] sm:flex"
            >
              Continue shopping
              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_350px]">

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <div className="min-w-0">

            {/* -----------------------------------------------
                CART SECTION HEADER
            ------------------------------------------------ */}

            {activeLines.length > 0 && (
              <section>

                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink-800">
                    Cart items
                  </h2>

                  <span className="text-xs text-ink-400">
                    {activeLines.length}{' '}
                    {activeLines.length === 1
                      ? 'product'
                      : 'products'}
                  </span>
                </div>

                {/* -------------------------------------------
                    PRODUCTS
                -------------------------------------------- */}

                <div className="space-y-3">

                  {activeLines.map((line) => {
                    const product = line.product

                    if (!product) return null

                    const unitPrice =
                      line.unitPrice ?? product.price

                    const lineTotal =
                      unitPrice * line.quantity

                    const lowStock =
                      product.stock > 0 &&
                      product.stock < line.quantity

                    return (
                      <article
                        key={line.productId}
                        className="
                          group
                          overflow-hidden
                          rounded-2xl
                          border
                          border-ink-100
                          bg-white
                          transition
                          duration-200
                          hover:border-[#DCE2CC]
                          hover:shadow-[0_8px_30px_rgba(70,80,45,0.06)]
                        "
                      >
                        <div className="p-3.5 sm:p-4">

                          <div className="flex gap-4">

                            {/* PRODUCT IMAGE */}

                            <Link
                              to={`/product/${product.slug}`}
                              className="
                                flex
                                h-[100px]
                                w-[100px]
                                shrink-0
                                items-center
                                justify-center
                                overflow-hidden
                                rounded-xl
                                bg-[#F5F7EF]
                                sm:h-[112px]
                                sm:w-[112px]
                              "
                            >
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="
                                    h-full
                                    w-full
                                    object-cover
                                    transition
                                    duration-300
                                    group-hover:scale-[1.04]
                                  "
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <Sprout
                                  className="h-8 w-8 text-[#667744]"
                                  strokeWidth={1.5}
                                />
                              )}
                            </Link>

                            {/* PRODUCT INFORMATION */}

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-4">

                                <div className="min-w-0">

                                  <Link
                                    to={`/product/${product.slug}`}
                                    className="
                                      line-clamp-2
                                      text-sm
                                      font-semibold
                                      leading-5
                                      text-ink-900
                                      transition
                                      hover:text-[#667744]
                                      sm:text-[15px]
                                    "
                                  >
                                    {product.name}
                                  </Link>

                                  {line.variantName && (
                                    <p className="mt-1 text-xs text-ink-400">
                                      {line.variantName}
                                    </p>
                                  )}

                                </div>

                                {/* DESKTOP PRICE */}

                                <div className="hidden shrink-0 text-right sm:block">

                                  <p className="text-base font-semibold tracking-tight text-ink-900">
                                    {formatINR(lineTotal)}
                                  </p>

                                  <p className="mt-0.5 text-[11px] text-ink-400">
                                    {formatINR(unitPrice)} each
                                  </p>

                                </div>

                              </div>

                              {/* MOBILE PRICE */}

                              <div className="mt-2 sm:hidden">

                                <p className="text-base font-semibold text-ink-900">
                                  {formatINR(lineTotal)}
                                </p>

                                <p className="text-[11px] text-ink-400">
                                  {formatINR(unitPrice)} each
                                </p>

                              </div>

                              {/* LOW STOCK */}

                              {lowStock && (
                                <p className="mt-1.5 text-[11px] font-medium text-danger-500">
                                  {t('cart.onlyLeftInStock', {
                                    count: product.stock,
                                  })}
                                </p>
                              )}

                              {/* CONTROLS */}

                              <div className="mt-3 flex flex-wrap items-center gap-3">

                                {/* QUANTITY */}

                                <div
                                  className="
                                    flex
                                    h-9
                                    items-center
                                    overflow-hidden
                                    rounded-xl
                                    border
                                    border-[#DCE2CC]
                                    bg-[#F5F7EF]
                                  "
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQuantity(
                                        line.productId,
                                        line.quantity - 1,
                                      )
                                    }
                                    disabled={line.quantity <= 1}
                                    aria-label={t(
                                      'common.decreaseQuantity',
                                    )}
                                    className="
                                      flex
                                      h-full
                                      w-8
                                      items-center
                                      justify-center
                                      text-[#667744]
                                      transition
                                      hover:bg-[#EEF1E6]
                                      disabled:text-ink-300
                                    "
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>

                                  <span
                                    className="
                                      flex
                                      h-full
                                      min-w-9
                                      items-center
                                      justify-center
                                      border-x
                                      border-[#DCE2CC]
                                      bg-white
                                      text-xs
                                      font-semibold
                                      text-ink-800
                                    "
                                  >
                                    {line.quantity}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQuantity(
                                        line.productId,
                                        line.quantity + 1,
                                      )
                                    }
                                    disabled={
                                      line.quantity >= product.stock
                                    }
                                    aria-label={t(
                                      'common.increaseQuantity',
                                    )}
                                    className="
                                      flex
                                      h-full
                                      w-8
                                      items-center
                                      justify-center
                                      text-[#667744]
                                      transition
                                      hover:bg-[#EEF1E6]
                                      disabled:text-ink-300
                                    "
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>

                                <span className="h-4 w-px bg-ink-100" />

                                {/* SAVE */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleSaveForLater(
                                      line.productId,
                                    )
                                  }
                                  className="
                                    flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    font-medium
                                    text-ink-500
                                    transition
                                    hover:text-[#667744]
                                  "
                                >
                                  <Bookmark className="h-3.5 w-3.5" />

                                  {t('cart.saveForLater')}
                                </button>

                                {/* REMOVE */}

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeFromCart(line.productId)
                                  }
                                  className="
                                    flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    font-medium
                                    text-ink-400
                                    transition
                                    hover:text-danger-500
                                  "
                                >
                                  <Trash2 className="h-3.5 w-3.5" />

                                  {t('cart.remove')}
                                </button>

                              </div>

                            </div>

                          </div>

                        </div>
                      </article>
                    )
                  })}

                </div>

              </section>
            )}

            {/* =================================================
                SAVED FOR LATER
            ================================================= */}

            {savedLines.length > 0 && (
              <section className="mt-9">

                <div className="mb-3 flex items-center justify-between">

                  <div>
                    <h2 className="text-sm font-semibold text-ink-800">
                      {t('cart.savedForLaterTitle')}
                    </h2>

                    <p className="mt-0.5 text-xs text-ink-400">
                      Products you've saved for later
                    </p>
                  </div>

                  <span className="text-xs text-ink-400">
                    {savedLines.length}
                  </span>

                </div>

                <div className="space-y-2.5">

                  {savedLines.map((line) => {
                    const product = line.product

                    if (!product) return null

                    return (
                      <div
                        key={line.productId}
                        className="
                          flex
                          items-center
                          gap-3
                          rounded-2xl
                          border
                          border-ink-100
                          bg-white
                          p-3
                        "
                      >

                        {/* IMAGE */}

                        <div
                          className="
                            flex
                            h-14
                            w-14
                            shrink-0
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-xl
                            bg-[#F5F7EF]
                          "
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <Sprout
                              className="h-5 w-5 text-[#667744]"
                              strokeWidth={1.5}
                            />
                          )}
                        </div>

                        {/* INFO */}

                        <div className="min-w-0 flex-1">

                          <p className="line-clamp-1 text-sm font-medium text-ink-700">
                            {product.name}
                          </p>

                          <p className="mt-0.5 text-xs text-ink-400">
                            {formatINR(product.price)}
                          </p>

                        </div>

                        {/* MOVE */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleSaveForLater(
                              line.productId,
                            )
                          }
                          className="
                            flex
                            shrink-0
                            items-center
                            gap-1.5
                            rounded-xl
                            border
                            border-[#DCE2CC]
                            bg-[#F5F7EF]
                            px-3
                            py-2
                            text-xs
                            font-semibold
                            text-[#667744]
                            transition
                            hover:bg-[#EEF1E6]
                          "
                        >
                          <BookmarkCheck className="h-3.5 w-3.5" />

                          <span className="hidden sm:inline">
                            {t('cart.moveToCart')}
                          </span>

                          <span className="sm:hidden">
                            Move
                          </span>
                        </button>

                      </div>
                    )
                  })}

                </div>

              </section>
            )}

          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <aside className="lg:sticky lg:top-5">

            <div
              className="
                overflow-hidden
                rounded-2xl
                border
                border-ink-100
                bg-white
                shadow-[0_8px_30px_rgba(70,80,45,0.055)]
              "
            >

              {/* SUMMARY HEADER */}

              <div className="border-b border-ink-100 px-5 py-5">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="text-base font-semibold text-ink-900">
                      {t('cart.orderSummary')}
                    </h2>

                    <p className="mt-1 text-xs text-ink-400">
                      Review your order
                    </p>
                  </div>

                  <div
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#EEF1E6]
                    "
                  >
                    <ShoppingCart
                      className="h-4 w-4 text-[#667744]"
                      strokeWidth={1.8}
                    />
                  </div>

                </div>

              </div>

              {/* SUMMARY CONTENT */}

              <div className="p-5">

                {/* DELIVERY INFO */}

                <div
                  className="
                    mb-5
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    bg-[#F5F7EF]
                    px-3.5
                    py-3
                  "
                >

                  <div
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-white
                    "
                  >
                    <Truck
                      className="h-4 w-4 text-[#667744]"
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs font-semibold text-ink-700">
                      {deliveryFee === 0
                        ? 'Free delivery'
                        : 'Delivery available'}
                    </p>

                    <p className="mt-0.5 text-[11px] leading-4 text-ink-400">
                      {deliveryFee === 0
                        ? 'Your order qualifies for free delivery.'
                        : t('cart.freeDeliveryNote')}
                    </p>

                  </div>

                </div>

                {/* PRICE BREAKDOWN */}

                <div className="space-y-3">

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500">
                      {t('cart.subtotal')}
                    </span>

                    <span className="font-medium text-ink-800">
                      {formatINR(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-500">
                      {t('cart.delivery')}
                    </span>

                    <span
                      className={
                        deliveryFee === 0
                          ? 'font-semibold text-[#667744]'
                          : 'font-medium text-ink-800'
                      }
                    >
                      {deliveryFee === 0
                        ? t('cart.free')
                        : formatINR(deliveryFee)}
                    </span>
                  </div>

                </div>

                {/* TOTAL */}

                <div className="my-5 border-t border-dashed border-ink-200 pt-4">

                  <div className="flex items-end justify-between">

                    <div>
                      <p className="text-xs text-ink-400">
                        {t('cart.total')}
                      </p>

                      <p className="mt-1 text-xl font-bold tracking-tight text-ink-950">
                        {formatINR(total)}
                      </p>
                    </div>

                    <span className="text-[10px] font-medium text-[#667744]">
                      Final amount
                    </span>

                  </div>

                </div>

                {/* CHECKOUT */}

                <Button
                  fullWidth
                  className="
                    h-11
                    rounded-xl
                    bg-[#253308]
                    text-sm
                    font-semibold
                    text-white
                    shadow-none
                    transition
                    hover:bg-[#4F5F32]
                  "
                  onClick={() => navigate('/checkout')}
                  disabled={activeLines.length === 0}
                >
                  {t('cart.proceedToCheckout')}

                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>

                {/* CONTINUE */}

                <Link
                  to="/market"
                  className="
                    mt-3
                    flex
                    h-10
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    border
                    border-ink-200
                    text-xs
                    font-medium
                    text-ink-500
                    transition
                    hover:border-[#DCE2CC]
                    hover:bg-[#F5F7EF]
                    hover:text-[#667744]
                  "
                >
                  Continue shopping

                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

              </div>

            </div>

          </aside>

        </div>

      </div>
    </div>
  )
}