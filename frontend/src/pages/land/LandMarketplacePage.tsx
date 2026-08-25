import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MapPin,
  Ruler,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Droplets,
  Layers,
  Sparkles,
  CalendarCheck,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { useLand } from '@/context/LandContext'
import { useAuth } from '@/context/AuthContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { BackendLandDealType, LandQueryParams } from '@/services/landService'

export default function LandMarketplacePage() {
  const { listings, fetchListings, isLoading, error, meta } = useLand()
  const { isSeller } = useAuth()

  const [search, setSearch] = useState('')
  const [dealType, setDealType] = useState<BackendLandDealType | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<LandQueryParams['sortBy']>('newest')
  const [showFilters, setShowFilters] = useState(false)

  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minArea, setMinArea] = useState('')
  const [maxArea, setMaxArea] = useState('')

  // Trigger listing fetch whenever filters change
  const loadData = () => {
    const params: LandQueryParams = {
      search: search.trim() || undefined,
      dealType: dealType === 'ALL' ? undefined : dealType,
      sortBy,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minArea: minArea ? Number(minArea) : undefined,
      maxArea: maxArea ? Number(maxArea) : undefined,
    }
    fetchListings(params)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealType, sortBy])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  const resetFilters = () => {
    setSearch('')
    setDealType('ALL')
    setSortBy('newest')
    setMinPrice('')
    setMaxPrice('')
    setMinArea('')
    setMaxArea('')
    fetchListings({})
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      {/* Header Banner */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-soil-900 to-amber-950 p-6 text-white shadow-lg md:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" /> Direct Verified Listings
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Agricultural Land Marketplace</h1>
          <p className="mt-2 text-sm text-emerald-100/80 md:text-base">
            Buy, sell, or lease verified fertile farmland, orchards, and agricultural plots across India with direct seller contact.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/land/visits"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <CalendarCheck className="h-4 w-4" /> My Visit Requests
            </Link>
            {isSeller && (
              <Link
                to="/seller/add-land"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-600"
              >
                <Plus className="h-4 w-4" /> Post Land Listing
              </Link>
            )}
          </div>
        </div>
        {/* Subtle background decoration */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search land by location, title, or description (e.g. Katni, Irrigated, Borewell)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-ink-200 bg-surface pl-10 pr-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition',
              showFilters ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 bg-surface text-ink-700 hover:bg-ink-50',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </form>

        {/* Filters and Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Deal Type Tabs */}
          <div className="flex gap-1 rounded-2xl bg-surface-sunk p-1">
            {(['ALL', 'SALE', 'LEASE'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDealType(type)}
                className={cn(
                  'rounded-xl px-4 py-1.5 text-xs font-semibold transition',
                  dealType === type ? 'bg-surface shadow-card text-ink-900' : 'text-ink-500 hover:text-ink-900',
                )}
              >
                {type === 'ALL' ? 'All Plots' : type === 'SALE' ? 'For Sale' : 'For Lease'}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-ink-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as LandQueryParams['sortBy'])}
              className="rounded-xl border border-ink-200 bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 focus:border-brand-500 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_asc">Area: Low to High</option>
              <option value="area_desc">Area: High to Low</option>
            </select>
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        {showFilters && (
          <div className="rounded-2xl border border-ink-100 bg-surface p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-600">Min Price (₹)</label>
                <input
                  type="number"
                  placeholder="Min price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 px-3 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-600">Max Price (₹)</label>
                <input
                  type="number"
                  placeholder="Max price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 px-3 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-600">Min Area (Acres)</label>
                <input
                  type="number"
                  placeholder="Min acres"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 px-3 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-600">Max Area (Acres)</label>
                <input
                  type="number"
                  placeholder="Max acres"
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                  className="w-full rounded-xl border border-ink-200 px-3 py-1.5 text-xs text-ink-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-ink-100 pt-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl px-3 py-1 text-xs font-semibold text-ink-500 hover:text-ink-900"
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={loadData}
                className="rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Listings Content */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-danger-100 bg-danger-50 p-4 text-xs text-danger-700">
          <span>{error}</span>
          <button type="button" onClick={loadData} className="flex items-center gap-1 font-semibold underline">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-ink-100 bg-surface p-4">
              <div className="h-44 w-full rounded-xl bg-ink-100" />
              <div className="mt-3 h-4 w-3/4 rounded bg-ink-100" />
              <div className="mt-2 h-3 w-1/2 rounded bg-ink-100" />
              <div className="mt-4 h-6 w-1/3 rounded bg-ink-100" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="mx-auto my-12 max-w-md rounded-3xl border border-dashed border-ink-200 p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-soil-50 text-soil-600">
            <MapPin className="h-7 w-7" />
          </div>
          <h3 className="text-base font-semibold text-ink-900">No land listings found</h3>
          <p className="mt-1 text-xs text-ink-500">Try loosening your search filters or check back soon for new plots.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-brand-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 text-xs text-ink-500">
            Showing <span className="font-semibold text-ink-900">{listings.length}</span> {meta ? `of ${meta.totalItems}` : ''} land listings
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((land) => {
              const primaryImg = land.images?.find((img) => img.isPrimary)?.url || land.images?.[0]?.url
              const priceNum = typeof land.price === 'string' ? parseFloat(land.price) : land.price
              const areaNum = typeof land.areaAcres === 'string' ? parseFloat(land.areaAcres) : land.areaAcres

              return (
                <Link
                  key={land.id}
                  to={`/land/${land.slug || land.id}`}
                  className="group flex flex-col justify-between rounded-2xl border border-ink-100 bg-surface p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-ink-950/5"
                >
                  <div>
                    {/* Image / Fallback Container */}
                    <div className="relative mb-3.5 h-44 overflow-hidden rounded-xl bg-soil-50">
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={land.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-soil-50 via-emerald-50/50 to-soil-100 p-4 text-center">
                          <MapPin className="h-10 w-10 text-soil-400 opacity-80" strokeWidth={1.4} />
                          <span className="mt-2 text-[11px] font-medium text-soil-700">{land.location}</span>
                        </div>
                      )}
                      <span
                        className={cn(
                          'absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-md',
                          land.dealType === 'SALE'
                            ? 'bg-emerald-600/90 text-white'
                            : 'bg-amber-500/90 text-white',
                        )}
                      >
                        For {land.dealType === 'SALE' ? 'Sale' : 'Lease'}
                      </span>
                    </div>

                    {/* Listing Title */}
                    <h2 className="line-clamp-1 text-base font-bold text-ink-900 group-hover:text-brand-600 transition-colors">
                      {land.title}
                    </h2>

                    {/* Meta information tags */}
                    <div className="mt-2 space-y-1 text-xs text-ink-500">
                      <p className="flex items-center gap-1.5 line-clamp-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                        <span>{land.location}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <span className="flex items-center gap-1 text-ink-700 font-medium">
                          <Ruler className="h-3.5 w-3.5 text-soil-500" />
                          {areaNum} Acres
                        </span>
                        {land.soilType && (
                          <span className="flex items-center gap-1 rounded-md bg-soil-50 px-2 py-0.5 text-[11px] font-medium text-soil-700">
                            <Layers className="h-3 w-3 text-soil-500" />
                            {land.soilType}
                          </span>
                        )}
                        {land.waterSource && (
                          <span className="flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                            <Droplets className="h-3 w-3 text-sky-500" />
                            {land.waterSource}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-4 flex items-end justify-between border-t border-ink-100 pt-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-ink-400">
                        {land.dealType === 'LEASE' ? 'Annual Rent' : 'Total Price'}
                      </p>
                      <p className="text-lg font-extrabold text-ink-900">
                        {formatINR(priceNum)}
                        {land.dealType === 'LEASE' && <span className="text-xs font-normal text-ink-400">/yr</span>}
                      </p>
                    </div>
                    <span className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      View Details
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
