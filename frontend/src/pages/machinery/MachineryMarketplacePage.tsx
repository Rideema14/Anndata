import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, MapPin, PackageX, Search, Star, Tractor } from 'lucide-react'
import { machineryService, type MachineryCategory, type MachineryListing } from '@/services/machineryService'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])
  return debounced
}

export default function MachineryMarketplacePage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [categorySlug, setCategorySlug] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'rating'>('newest')

  const [categories, setCategories] = useState<MachineryCategory[]>([])
  const [listings, setListings] = useState<MachineryListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    machineryService.listCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError('')
    machineryService
      .list({
        search: debouncedSearch.trim() || undefined,
        category: categorySlug || undefined,
        sortBy,
        limit: 48,
      })
      .then((res) => {
        if (!cancelled) setListings(res.items)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load machinery listings. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch, categorySlug, sortBy])

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 text-xl">Machinery Rental</h1>
      <p className="mb-5 text-sm text-ink-500">Tractors, harvesters and tools for rent nearby.</p>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tractors, harvesters, tools…"
            className="h-11 w-full rounded-xl border border-ink-200 bg-surface pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400"
          />
        </div>
        <select
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className="h-11 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-900 focus:border-brand-400"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="h-11 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-900 focus:border-brand-400"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {error && <p className="mb-4 text-sm font-medium text-danger-500">{error}</p>}

      {isLoading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-ink-300" aria-hidden="true" />
        </div>
      ) : listings.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-ink-100 bg-surface px-6 py-12 text-center">
          <PackageX className="mb-3 h-10 w-10 text-ink-300" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink-800">No machinery found</p>
          <p className="mt-1 text-xs text-ink-500">Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((m) => (
            <Link key={m.id} to={`/machinery/${m.slug}`} className="rounded-2xl border border-ink-100 bg-surface p-4 hover:shadow-card">
              <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-xl bg-soil-50">
                {m.images[0] ? (
                  <img src={m.images[0]} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <Tractor className="h-10 w-10 text-soil-400" strokeWidth={1.4} aria-hidden="true" />
                )}
              </div>
              <div className="flex items-start justify-between">
                <h2 className="text-sm font-semibold text-ink-900">{m.name}</h2>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    m.available ? 'bg-brand-50 text-brand-700' : 'bg-danger-50 text-danger-500',
                  )}
                >
                  {m.available ? 'Available' : 'Inactive'}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {m.categoryName}{m.ownerName ? ` · ${m.ownerName}` : ''}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" aria-hidden="true" />
                {m.rating.toFixed(1)} ({m.reviewCount})
              </p>
              <p className="mt-2 text-base font-bold text-ink-900">
                {formatINR(m.pricePerDay)} <span className="text-xs font-normal text-ink-400">/ day</span>
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
