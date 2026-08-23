import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  Clock3,
  Filter,
  Flame,
  MapPinned,
  PackageX,
  RotateCcw,
  SlidersHorizontal,

} from 'lucide-react'

import { ProductCard } from '@/components/common/ProductCard'
import { ProductRail } from '@/components/common/ProductRail'

import { categoryService, type Category } from '@/services/categoryService'
import { productService } from '@/services/productService'
import type { Product } from '@/types'

import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

type SortKey =
  | 'relevance'
  | 'price-low'
  | 'price-high'
  | 'rating'

const SORT_TO_API: Record<
  SortKey,
  'popular' | 'price_asc' | 'price_desc' | 'rating'
> = {
  relevance: 'popular',
  'price-low': 'price_asc',
  'price-high': 'price_desc',
  rating: 'rating',
}

/* =========================================================
   DEBOUNCE
========================================================= */

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value)
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}

/* =========================================================
   PAGE
========================================================= */

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useLanguage()

  const query = searchParams.get('q') ?? ''

  const [sort, setSort] = useState<SortKey>('relevance')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const debouncedQuery = useDebouncedValue(query, 300)
  const debouncedMinPrice = useDebouncedValue(minPrice, 400)
  const debouncedMaxPrice = useDebouncedValue(maxPrice, 400)

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let cancelled = false

    categoryService
      .list()
      .then((items) => {
        if (!cancelled) {
          setCategories(items)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  /* =======================================================
     TOP DEALS
  ======================================================= */

  const [topDeals, setTopDeals] = useState<Product[]>([])

  useEffect(() => {
    let cancelled = false

    productService
      .topDeals(6)
      .then((items) => {
        if (!cancelled) {
          setTopDeals(items)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTopDeals([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  /* =======================================================
     NEARBY PRODUCTS
  ======================================================= */

  const [nearbyProducts, setNearbyProducts] = useState<Product[]>([])
  const [nearbyLabel, setNearbyLabel] = useState('Near You')

  useEffect(() => {
    let cancelled = false

    function loadFallback() {
      productService
        .list({
          sortBy: 'newest',
          limit: 6,
        })
        .then((res) => {
          if (!cancelled) {
            setNearbyProducts(res.items)
          }
        })
        .catch(() => {
          if (!cancelled) {
            setNearbyProducts([])
          }
        })
    }

    if (!navigator.geolocation) {
      loadFallback()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return

        setNearbyLabel('Near You')

        productService
          .nearby(
            position.coords.latitude,
            position.coords.longitude,
          )
          .then((items) => {
            if (!cancelled) {
              setNearbyProducts(items)
            }
          })
          .catch(() => {
            if (!cancelled) {
              loadFallback()
            }
          })
      },
      () => {
        if (!cancelled) {
          loadFallback()
        }
      },
      {
        timeout: 8000,
      },
    )

    return () => {
      cancelled = true
    }
  }, [])

  /* =======================================================
     SEARCH / FILTER / SORT
  ======================================================= */

  const [results, setResults] = useState<Product[]>([])
  const [isLoadingResults, setIsLoadingResults] = useState(true)

  useEffect(() => {
    let cancelled = false

    setIsLoadingResults(true)

    const min =
      debouncedMinPrice !== '' &&
      !Number.isNaN(Number(debouncedMinPrice))
        ? Number(debouncedMinPrice)
        : undefined

    const max =
      debouncedMaxPrice !== '' &&
      !Number.isNaN(Number(debouncedMaxPrice))
        ? Number(debouncedMaxPrice)
        : undefined

    productService
      .list({
        search: debouncedQuery.trim() || undefined,
        minPrice: min,
        maxPrice: max,
        sortBy: SORT_TO_API[sort],
        limit: 48,
      })
      .then((res) => {
        if (!cancelled) {
          setResults(res.items)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingResults(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    debouncedQuery,
    debouncedMinPrice,
    debouncedMaxPrice,
    sort,
  ])

  /* =======================================================
     ACTIONS
  ======================================================= */

  const resetFilters = () => {
    setMinPrice('')
    setMaxPrice('')
    setSort('relevance')
  }

  const hasActiveFilters = useMemo(
    () => Boolean(minPrice || maxPrice),
    [minPrice, maxPrice],
  )

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F5F5F1] text-[#182016]">
      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-7 sm:px-6 lg:px-8 lg:pt-10">

        {/* ===================================================
            PAGE HEADER
        =================================================== */}

        <section className="mb-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1
                className="
                  font-serif
                  text-[34px]
                  font-black
                  leading-[1.05]
                  tracking-[-0.045em]
                  text-[#14200F]
                  sm:text-[46px]
                "
              >
                {query
                  ? `Results for "${query}"`
                  : t('nav.market')}
              </h1>

              <p className="mt-3 max-w-[650px] text-[14px] font-medium leading-6 text-[#697163] sm:text-[15px]">
                Shop quality agricultural products from trusted sellers,
                with prices and deals made for everyday farming.
              </p>
            </div>

            {query && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="
                  inline-flex
                  h-10
                  w-fit
                  shrink-0
                  items-center
                  gap-2
                  rounded-lg
                  border
                  border-[#D8DBD1]
                  bg-white
                  px-4
                  text-[12px]
                  font-bold
                  text-[#37422F]
                  shadow-[0_2px_8px_rgba(30,40,24,0.04)]
                  transition-all
                  hover:border-[#AEB8A2]
                  hover:bg-[#FAFBF8]
                "
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear search
              </button>
            )}
          </div>
        </section>

        {/* ===================================================
            CATEGORY NAVIGATION
        =================================================== */}

        {categories.length > 0 && (
          <section className="mb-10">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#687160]">
                Shop by category
              </h2>
            </div>

            <div className="scrollbar-none flex gap-2.5 overflow-x-auto pb-1">
              {categories.map((cat) => {
                const CategoryIcon = cat.icon

                return (
                  <Link
                    key={cat.id}
                    to={`/market/${cat.slug}`}
                    className="
                      group
                      flex
                      h-[54px]
                      shrink-0
                      items-center
                      gap-3
                      rounded-xl
                      border
                      border-[#DEE1D7]
                      bg-white
                      px-3.5
                      pr-5
                      shadow-[0_2px_7px_rgba(32,42,25,0.035)]
                      transition-all
                      duration-200
                      hover:-translate-y-0.5
                      hover:border-[#B8C1AD]
                      hover:shadow-[0_7px_18px_rgba(32,42,25,0.07)]
                    "
                  >
                    <span
                      className="
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-lg
                        bg-[#EEF2E9]
                        text-[#435537]
                        transition-all
                        duration-200
                        group-hover:bg-[#35462C]
                        group-hover:text-white
                      "
                    >
                      <CategoryIcon
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                    </span>

                    <span className="text-[13px] font-extrabold text-[#293424]">
                      {cat.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* ===================================================
            FEATURED SECTIONS
        =================================================== */}

        {!query && (
          <div className="mb-11 space-y-8">

            {/* =================================================
                LIMITED TIME DEALS
            ================================================= */}

            <section
              className="
                overflow-hidden
                rounded-2xl
                border
                border-[#263321]
                bg-[#202B1B]
                shadow-[0_10px_30px_rgba(24,34,19,0.12)]
              "
            >
              {/* TOP SALE BAR */}

              <div className="flex flex-col border-b border-[#35412F] sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3.5 px-5 py-4 sm:px-6">

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-[#D8B94E]
                      text-[#202B1B]
                    "
                  >
                    <Flame
                      className="h-[19px] w-[19px]"
                      fill="currentColor"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2
                        className="
                          font-serif
                          text-[21px]
                          font-black
                          tracking-[-0.025em]
                          text-white
                          sm:text-[24px]
                        "
                      >
                        Limited Time Deals
                      </h2>

                      <span
                        className="
                          rounded
                          bg-[#35412E]
                          px-2
                          py-1
                          text-[8px]
                          font-extrabold
                          uppercase
                          tracking-[0.13em]
                          text-[#E1CA6A]
                        "
                      >
                        Deals
                      </span>
                    </div>

                    <p className="mt-0.5 text-[11px] font-medium text-[#AEB7A7] sm:text-[12px]">
                      Special prices on selected products
                    </p>
                  </div>
                </div>

                <div className="border-t border-[#35412F] px-5 py-3 sm:border-l sm:border-t-0 sm:px-6">
                  <div className="flex items-center gap-2 text-[#D8C15F]">
                    <Clock3 className="h-4 w-4" />

                    <span className="text-[11px] font-extrabold uppercase tracking-[0.1em]">
                      Ends Midnight
                    </span>
                  </div>
                </div>
              </div>

              {/* DEAL CONTENT */}

              <div className="p-3 sm:p-5">

                <div
                  className="
                    overflow-hidden
                    rounded-xl
                    border
                    border-[#E0E2DA]
                    bg-[#F7F7F2]
                    p-3
                    sm:p-4
                  "
                >
                  {topDeals.length > 0 ? (
                    <div
                      className="
                        grid
                        grid-cols-2
                        gap-3
                        sm:grid-cols-3
                        lg:grid-cols-6
                      "
                    >
                      {topDeals.map((product) => (
                        <div
                          key={product.id}
                          className="
                            min-w-0
                            [&>div]:h-full
                            [&_article]:h-full
                          "
                        >
                          <ProductCard product={product} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[220px] items-center justify-center">
                      <p className="text-sm font-medium text-[#747B70]">
                        No deals available right now.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* =================================================
                NEAR YOU
            ================================================= */}

            <section
              className="
                overflow-hidden
                rounded-2xl
                border
                border-[#DDE1D7]
                bg-[#EAEDE5]
                shadow-[0_5px_20px_rgba(35,45,28,0.05)]
              "
            >
              <div className="px-5 py-5 sm:px-6 sm:py-6">

                <div className="mb-4 flex items-center gap-3">

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      bg-[#D3DDC8]
                      text-[#3D4D34]
                    "
                  >
                    <MapPinned className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2
                        className="
                          text-[18px]
                          font-black
                          tracking-[-0.025em]
                          text-[#1D2819]
                          sm:text-[20px]
                        "
                      >
                        {nearbyLabel}
                      </h2>

                      <span
                        className="
                          rounded
                          bg-[#D5DDCC]
                          px-2
                          py-1
                          text-[8px]
                          font-extrabold
                          uppercase
                          tracking-[0.12em]
                          text-[#4A5A3F]
                        "
                      >
                        Local
                      </span>
                    </div>

                    <p className="mt-0.5 text-[12px] font-medium text-[#6C7567]">
                      Products from sellers around your region.
                    </p>
                  </div>
                </div>

                <div
                  className="
                    rounded-xl
                    border
                    border-[#DDE1D8]
                    bg-white
                    p-3
                    shadow-[0_2px_8px_rgba(30,40,24,0.035)]
                    sm:p-4
                  "
                >
                  <ProductRail
                    title=""
                    icon={MapPinned}
                    products={nearbyProducts}
                    accentClass="text-[#435537]"
                  />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <section className="mb-5">
          <div
            className="
              flex
              flex-col
              gap-3
              rounded-xl
              border
              border-[#DEE0D7]
              bg-white
              p-2.5
              shadow-[0_2px_9px_rgba(30,40,24,0.035)]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((prev) => !prev)}
                className={cn(
                  `
                    inline-flex
                    h-9
                    items-center
                    gap-2
                    rounded-lg
                    px-3.5
                    text-[12px]
                    font-extrabold
                    transition-all
                    duration-200
                  `,
                  showFilters
                    ? 'bg-[#25321F] text-white'
                    : 'border border-[#DDDED6] bg-[#FAFAF7] text-[#34412D] hover:bg-[#F0F2EB]',
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />

                Filters

                {hasActiveFilters && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D5B957] px-1 text-[8px] font-black text-[#1B2516]">
                    !
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#858B7D] sm:inline">
                Sort by
              </span>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as SortKey)
                }
                aria-label={t('common.sort')}
                className="
                  h-9
                  min-w-[160px]
                  rounded-lg
                  border
                  border-[#DDDED6]
                  bg-[#FAFAF7]
                  px-3
                  text-[12px]
                  font-extrabold
                  text-[#2C3725]
                  outline-none
                  transition-colors
                  focus:border-[#9EAA8E]
                "
              >
                <option value="relevance">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </section>

        {/* ===================================================
            FILTER PANEL
        =================================================== */}

        {showFilters && (
          <section
            className="
              mb-6
              rounded-xl
              border
              border-[#324029]
              bg-[#25321F]
              p-4
              text-white
              shadow-lg
              sm:p-5
            "
          >
            <div className="mb-4 flex items-center justify-between border-b border-[#3A4934] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#D5B957]" />

                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#E5E8DF]">
                  Price range
                </span>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="
                  text-[11px]
                  font-bold
                  text-[#B2BFA7]
                  transition-colors
                  hover:text-white
                "
              >
                Reset
              </button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

              <label className="flex flex-1 flex-col">
                <span className="mb-1.5 text-[11px] font-medium text-[#A0AC96]">
                  Minimum price
                </span>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#6D7964]">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="
                      h-10
                      w-full
                      rounded-lg
                      border
                      border-white/10
                      bg-white
                      pl-7
                      pr-3
                      text-[13px]
                      font-bold
                      text-[#1E281A]
                      outline-none
                      placeholder:font-normal
                      placeholder:text-[#9EA298]
                      focus:border-[#D5B957]
                      sm:w-44
                    "
                  />
                </div>
              </label>

              <label className="flex flex-1 flex-col">
                <span className="mb-1.5 text-[11px] font-medium text-[#A0AC96]">
                  Maximum price
                </span>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#6D7964]">
                    ₹
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="50,000"
                    className="
                      h-10
                      w-full
                      rounded-lg
                      border
                      border-white/10
                      bg-white
                      pl-7
                      pr-3
                      text-[13px]
                      font-bold
                      text-[#1E281A]
                      outline-none
                      placeholder:font-normal
                      placeholder:text-[#9EA298]
                      focus:border-[#D5B957]
                      sm:w-44
                    "
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="
                  inline-flex
                  h-10
                  shrink-0
                  items-center
                  justify-center
                  gap-1.5
                  rounded-lg
                  bg-[#D5B957]
                  px-5
                  text-[12px]
                  font-extrabold
                  text-[#1B2516]
                  transition-all
                  hover:bg-[#E1C86A]
                "
              >
                <Check className="h-4 w-4" />
                Apply filters
              </button>
            </div>
          </section>
        )}

        {/* ===================================================
            PRODUCT GRID
        =================================================== */}

        {!isLoadingResults && results.length === 0 ? (
          <section
            className="
              flex
              min-h-[320px]
              flex-col
              items-center
              justify-center
              rounded-xl
              border
              border-[#E0E0D8]
              bg-white
              px-6
              py-12
              text-center
              shadow-sm
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-[#EEF1EA]
                text-[#4E603E]
              "
            >
              <PackageX className="h-7 w-7" />
            </div>

            <h3 className="mt-4 text-[16px] font-extrabold text-[#212C1B]">
              No products found
            </h3>

            <p className="mt-1 max-w-sm text-[13px] text-[#6E7568]">
              Try adjusting your search query or price parameters.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchParams({})
                resetFilters()
              }}
              className="
                mt-5
                inline-flex
                h-9
                items-center
                gap-2
                rounded-lg
                bg-[#222E1C]
                px-4
                text-[12px]
                font-extrabold
                text-white
                transition-colors
                hover:bg-[#314129]
              "
            >
              Reset filters
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </section>
        ) : (
          <section>

            <div className="mb-5">
              <h2
                className="
                  font-serif
                  text-[21px]
                  font-black
                  tracking-[-0.035em]
                  text-[#1A2516]
                  sm:text-[23px]
                "
              >
                {query ? 'Search results' : 'All products'}
              </h2>

              <p className="mt-1 text-[12px] font-medium text-[#737A6D]">
                Quality products from verified sellers
              </p>
            </div>

            <div
              className="
                grid
                grid-cols-2
                items-stretch
                gap-3
                sm:grid-cols-3
                sm:gap-5
                lg:grid-cols-4
              "
            >
              {results.map((product) => (
                <div
                  key={product.id}
                  className="
                    flex
                    min-w-0
                    [&>div]:flex
                    [&>div]:h-full
                    [&_article]:flex
                    [&_article]:h-full
                  "
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}