import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPinned, PackageX, SlidersHorizontal, Tag } from 'lucide-react'
import { ProductCard } from '@/components/common/ProductCard'
import { ProductRail } from '@/components/common/ProductRail'
import { mockCategories } from '@/data/mock/mockCategories'
import { getNearbyProducts, getTopDeals, mockProductCatalog } from '@/data/mock/mockProductCatalog'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/utils/cn'

type SortKey = 'relevance' | 'price-low' | 'price-high' | 'rating'

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useLanguage()
  const { user } = useAuth()
  const query = searchParams.get('q') ?? ''
  const [sort, setSort] = useState<SortKey>('relevance')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const topDeals = useMemo(() => getTopDeals(), [])
  const nearbyProducts = useMemo(() => getNearbyProducts(user?.location ?? ''), [user?.location])

  const results = useMemo(() => {
    let list = [...mockProductCatalog]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.categorySlug.includes(q))
    }
    const min = Number(minPrice)
    const max = Number(maxPrice)
    if (minPrice) list = list.filter((p) => p.price >= min)
    if (maxPrice) list = list.filter((p) => p.price <= max)

    switch (sort) {
      case 'price-low':
        return list.sort((a, b) => a.price - b.price)
      case 'price-high':
        return list.sort((a, b) => b.price - a.price)
      case 'rating':
        return list.sort((a, b) => b.rating - a.rating)
      default:
        return list
    }
  }, [query, sort, minPrice, maxPrice])

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl">{query ? `Results for "${query}"` : t('nav.market')}</h1>
        {query && (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="text-xs font-semibold text-brand-600 hover:underline"
          >
            {t('common.reset')}
          </button>
        )}
      </div>

      {/* Category rail */}
      <div className="scrollbar-none mb-5 flex gap-2 overflow-x-auto pb-1">
        {mockCategories.map((cat) => (
          <Link
            key={cat.id}
            to={`/market/${cat.slug}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-ink-100 bg-surface px-3.5 py-2 text-xs font-medium text-ink-700 hover:border-brand-300"
          >
            <cat.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Top Deals + Nearby, only shown on the unfiltered browse view */}
      {!query && (
        <>
          <ProductRail title="Top Deals" icon={Tag} products={topDeals} accentClass="text-danger-500" />
          <ProductRail title={`Near You${user ? ` — ${user.location.split(',')[0]}` : ''}`} icon={MapPinned} products={nearbyProducts} accentClass="text-sky-600" />
        </>
      )}

      {/* Sort + filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilters((p) => !p)}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium',
            showFilters ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-100 text-ink-600',
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          {t('common.filter')}
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label={t('common.sort')}
          className="rounded-full border border-ink-100 bg-surface px-3.5 py-2 text-xs font-medium text-ink-700"
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
        <span className="text-xs text-ink-400">{results.length} products</span>
      </div>

      {showFilters && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-ink-100 bg-surface p-3">
          <label className="text-xs font-medium text-ink-600">
            {t('common.min')} ₹
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="mt-1 block h-9 w-24 rounded-lg border border-ink-200 px-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-ink-600">
            {t('common.max')} ₹
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="mt-1 block h-9 w-24 rounded-lg border border-ink-200 px-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setMinPrice('')
              setMaxPrice('')
            }}
            className="h-9 rounded-full px-3 text-xs font-semibold text-brand-600 hover:underline"
          >
            {t('common.reset')}
          </button>
        </div>
      )}

      {results.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <PackageX className="mb-3 h-10 w-10 text-ink-300" aria-hidden="true" />
          <p className="text-sm text-ink-500">{t('common.emptyGeneric')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
