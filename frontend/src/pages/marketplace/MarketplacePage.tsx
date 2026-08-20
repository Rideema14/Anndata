import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  MapPinned,
  PackageX,
  SlidersHorizontal,
  Tag,
  RotateCcw,
  Clock,
  Filter,
  Check,
  Flame,
  ArrowRight,
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

const SORT_TO_API: Record<SortKey, 'popular' | 'price_asc' | 'price_desc' | 'rating'> = {
  relevance: 'popular',
  'price-low': 'price_asc',
  'price-high': 'price_desc',
  rating: 'rating',
}

/** Debounces filter/search inputs so we don't fire an API call on every keystroke. */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

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

  // =========================================================
  // CATEGORIES
  // =========================================================

  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    let cancelled = false
    categoryService
      .list()
      .then((items) => {
        if (!cancelled) setCategories(items)
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // =========================================================
  // TOP DEALS
  // =========================================================

  const [topDeals, setTopDeals] = useState<Product[]>([])

  useEffect(() => {
    let cancelled = false
    productService
      .topDeals(6)
      .then((items) => {
        if (!cancelled) setTopDeals(items)
      })
      .catch(() => {
        if (!cancelled) setTopDeals([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  // =========================================================
  // NEARBY PRODUCTS
  // =========================================================
  // Uses the browser's geolocation for the backend's Haversine-distance
  // query. If permission is denied or unavailable, falls back to a general
  // "newest" list so the section still shows something useful.

  const [nearbyProducts, setNearbyProducts] = useState<Product[]>([])
  const [nearbyLabel, setNearbyLabel] = useState('Near You')

  useEffect(() => {
    let cancelled = false

    function loadFallback() {
      productService
        .list({ sortBy: 'newest', limit: 6 })
        .then((res) => {
          if (!cancelled) setNearbyProducts(res.items)
        })
        .catch(() => {
          if (!cancelled) setNearbyProducts([])
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
          .nearby(position.coords.latitude, position.coords.longitude)
          .then((items) => {
            if (!cancelled) setNearbyProducts(items)
          })
          .catch(() => {
            if (!cancelled) loadFallback()
          })
      },
      () => {
        if (!cancelled) loadFallback()
      },
      { timeout: 8000 },
    )

    return () => {
      cancelled = true
    }
  }, [])

  // =========================================================
  // SEARCH + FILTER + SORT (server-side)
  // =========================================================

  const [results, setResults] = useState<Product[]>([])
  const [isLoadingResults, setIsLoadingResults] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoadingResults(true)

    const min = debouncedMinPrice !== '' && !Number.isNaN(Number(debouncedMinPrice)) ? Number(debouncedMinPrice) : undefined
    const max = debouncedMaxPrice !== '' && !Number.isNaN(Number(debouncedMaxPrice)) ? Number(debouncedMaxPrice) : undefined

    productService
      .list({
        search: debouncedQuery.trim() || undefined,
        minPrice: min,
        maxPrice: max,
        sortBy: SORT_TO_API[sort],
        limit: 48,
      })
      .then((res) => {
        if (!cancelled) setResults(res.items)
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setIsLoadingResults(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, debouncedMinPrice, debouncedMaxPrice, sort])

  // =========================================================
  // RESET
  // =========================================================

  const resetFilters = () => {
    setMinPrice('')
    setMaxPrice('')
    setSort('relevance')
  }

  const hasActiveFilters = useMemo(() => Boolean(minPrice || maxPrice), [minPrice, maxPrice])

  return (
    <div className="min-h-screen bg-[#F4F6F0] font-sans text-[#17210F]">
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>
            <h1 className="text-3xl font-black tracking-[-0.025em] text-[#18200F] sm:text-3xl">
              {query
                ? `Results for "${query}"`
                : t('nav.market')}
            </h1>

            <p className="mt-1.5 max-w-xl text-xs font-medium leading-relaxed text-[#69745F]">
              Fresh agricultural products from trusted local sellers.
            </p>
          </div>

          {query && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#26351A] px-4 py-2.5 text-xs font-extrabold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#354725] active:translate-y-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Search
            </button>
          )}

        </div>


        {/* =====================================================
            CATEGORY NAVIGATION
        ===================================================== */}

        <div className="scrollbar-none mb-8 flex gap-2.5 overflow-x-auto pb-1">

          {categories.map((cat) => {
            const CategoryIcon = cat.icon

            return (
              <Link
                key={cat.id}
                to={`/market/${cat.slug}`}
                className="
                  group
                  flex shrink-0 items-center gap-2.5
                  rounded-xl
                  bg-white
                  px-3.5 py-2.5
                  text-xs font-bold text-[#34422A]
                  shadow-[0_2px_8px_rgba(39,53,27,0.05)]
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:bg-[#334625]
                  hover:text-white
                "
              >
                <span
                  className="
                    flex h-7 w-7 items-center justify-center
                    rounded-lg
                    bg-[#F0F4EA]
                    text-[#536D40]
                    transition-all duration-200
                    group-hover:bg-[#E7B928]
                    group-hover:text-[#26310F]
                  "
                >
                  <CategoryIcon
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                </span>

                <span>{cat.name}</span>
              </Link>
            )
          })}

        </div>


        {/* =====================================================
            FEATURED MARKETPLACE SECTIONS
        ===================================================== */}

        {!query && (
          <div className="mb-9 space-y-8">

            {/* =================================================
                LIMITED TIME OFFERS
            ================================================= */}

            <section className="relative overflow-hidden rounded-[22px] bg-[#283719] px-4 py-4 sm:px-6 sm:py-5">

              {/* subtle decorative background */}
              <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#EAB308]/10" />
              <div className="pointer-events-none absolute -bottom-16 left-1/3 h-36 w-36 rounded-full bg-[#9DB36E]/10" />

              <div className="relative mb-4 flex items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAB308] text-[#26310F]">
                    <Flame className="h-5 w-5" />

                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[8px] font-black text-[#26310F]">
                      !
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black tracking-tight text-white sm:text-lg">
                        Limited Time Deals
                      </h2>

                      <span className="hidden rounded-full bg-[#EAB308] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#26310F] sm:inline">
                        Hot
                      </span>
                    </div>

                    <p className="mt-0.5 text-[11px] font-semibold text-[#C9D5B7]">
                      Best prices available right now
                    </p>
                  </div>

                </div>


                <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black text-[#F5D45C] backdrop-blur-sm">
                  <Clock className="h-3 w-3" />
                  Ends Today
                </div>

              </div>


              {/* Deal products */}
              <div className="relative rounded-2xl bg-[#F8FAF4] p-2 sm:p-3">

                <ProductRail
                  title=""
                  icon={Tag}
                  products={topDeals}
                  accentClass="text-[#4D6839]"
                />

              </div>

            </section>


            {/* =================================================
                NEAR YOU
            ================================================= */}

            <section className="relative overflow-hidden rounded-[22px] bg-yellow-500/80 px-4 py-4 sm:px-6 sm:py-5">

              <div className="relative mb-4 flex items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3E5A2E] text-white shadow-sm">
                    <MapPinned className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">

                      <h2 className="text-base font-black tracking-tight text-[#26351A] sm:text-lg">
                        {nearbyLabel}
                      </h2>

                      <span className="rounded-full bg-[#D4E2C6] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#496438]">
                        Local
                      </span>

                    </div>

                    <p className="mt-0.5 text-[11px] font-semibold text-[#66765A]">
                      Products available closer to you
                    </p>
                  </div>

                </div>


                <div className="hidden items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-black text-[#4D6839] shadow-sm sm:flex">
                  <MapPinned className="h-3 w-3" />
                  Nearby
                </div>

              </div>


              <div className="relative rounded-2xl bg-white p-2 shadow-[0_3px_12px_rgba(43,64,31,0.06)] sm:p-3">

                <ProductRail
                  title=""
                  icon={MapPinned}
                  products={nearbyProducts}
                  accentClass="text-[#3E5A2E]"
                />

              </div>

            </section>

          </div>
        )}


        {/* =====================================================
            FILTER / SORT
        ===================================================== */}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

          <div className="flex flex-wrap items-center gap-2.5">

            <button
              type="button"
              onClick={() =>
                setShowFilters((prev) => !prev)
              }
              className={cn(
                `
                  flex items-center gap-2
                  rounded-xl
                  px-4 py-2.5
                  text-xs font-extrabold
                  transition-all duration-200
                `,
                showFilters
                  ? 'bg-[#E5B526] text-[#202B12] shadow-sm'
                  : 'bg-[#283719] text-white hover:-translate-y-0.5 hover:bg-[#354925]',
              )}
            >
              <SlidersHorizontal
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />

              {t('common.filter')}

              {hasActiveFilters && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/90 px-1 text-[8px] font-black text-[#26310F]">
                  !
                </span>
              )}
            </button>


            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as SortKey)
              }
              aria-label={t('common.sort')}
              className="
                rounded-xl
                bg-white
                px-3.5 py-2.5
                text-xs font-extrabold
                text-[#34422A]
                shadow-[0_2px_8px_rgba(39,53,27,0.05)]
                outline-none
                transition-all
                hover:bg-[#F0F4EA]
              "
            >
              <option value="relevance">
                Sort: Featured
              </option>

              <option value="price-low">
                Price: Low to High
              </option>

              <option value="price-high">
                Price: High to Low
              </option>

              <option value="rating">
                Highest Rated
              </option>
            </select>

          </div>


          <div className="flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 shadow-[0_2px_8px_rgba(39,53,27,0.05)]">

            <span className="text-sm font-black text-[#26351A]">
              {results.length}
            </span>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A866E]">
              Products
            </span>

          </div>

        </div>


        {/* =====================================================
            FILTER PANEL
        ===================================================== */}

        {showFilters && (
          <div className="mb-6 rounded-2xl bg-[#283719] p-5 text-white shadow-md">

            <div className="mb-4 flex items-center justify-between">

              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#F0C52D]">
                <Filter className="h-3.5 w-3.5" />
                Filter Products
              </div>

              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-[#C9D5B7] transition-colors hover:text-white"
              >
                Reset
              </button>

            </div>


            <div className="flex flex-wrap items-end gap-4">

              <label className="flex flex-col text-xs font-bold text-[#C9D5B7]">
                Min Price (₹)

                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) =>
                    setMinPrice(e.target.value)
                  }
                  placeholder="0"
                  className="
                    mt-1.5 h-10 w-32
                    rounded-xl
                    bg-white
                    px-3
                    text-xs font-bold
                    text-[#1B2312]
                    outline-none
                    ring-0
                    focus:ring-2
                    focus:ring-[#EAB308]
                  "
                />
              </label>


              <label className="flex flex-col text-xs font-bold text-[#C9D5B7]">
                Max Price (₹)

                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) =>
                    setMaxPrice(e.target.value)
                  }
                  placeholder="50000"
                  className="
                    mt-1.5 h-10 w-32
                    rounded-xl
                    bg-white
                    px-3
                    text-xs font-bold
                    text-[#1B2312]
                    outline-none
                    ring-0
                    focus:ring-2
                    focus:ring-[#EAB308]
                  "
                />
              </label>


              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="
                  inline-flex h-10 items-center gap-1.5
                  rounded-xl
                  bg-[#EAB308]
                  px-5
                  text-xs font-black
                  text-[#202B12]
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:bg-[#F3C62D]
                "
              >
                <Check className="h-3.5 w-3.5" />
                Apply
              </button>

            </div>

          </div>
        )}


        {/* =====================================================
            PRODUCT GRID
        ===================================================== */}

        {!isLoadingResults && results.length === 0 ? (

          <div className="my-8 flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDF2E8]">
              <PackageX className="h-8 w-8 text-[#4D6839]" />
            </div>

            <h3 className="mt-4 text-base font-black text-[#1B2312]">
              No Products Found
            </h3>

            <p className="mt-1 text-xs font-medium text-[#69745F]">
              Try changing your price filters or search terms.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchParams({})
                resetFilters()
              }}
              className="
                mt-5
                inline-flex items-center gap-2
                rounded-xl
                bg-[#283719]
                px-5 py-2.5
                text-xs font-extrabold
                text-white
                transition-all duration-200
                hover:-translate-y-0.5
                hover:bg-[#354925]
              "
            >
              Reset Filters
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

          </div>

        ) : (

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">

            {results.map((product) => (
              <div
                key={product.id}
                className="
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:drop-shadow-[0_8px_18px_rgba(38,53,26,0.12)]
                "
              >
                <ProductCard product={product} />
              </div>
            ))}

          </div>

        )}

      </main>
    </div>
  )
}
