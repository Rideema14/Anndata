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
  ArrowUpRight,
  Filter,
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

  const hasActiveFilters = Boolean(minPrice || maxPrice || minArea || maxArea)

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      {/* =================================================
          HERO
      ================================================= */}

      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-[#27351d] px-5 py-7 text-[#fbf7ec] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#68765e] bg-[#303f26] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#d6b841]">
            <Sparkles className="h-3.5 w-3.5" /> Direct Verified Listings
          </span>

          <h1 className="mt-3 text-[1.85rem] font-semibold leading-[1.12] tracking-[-0.02em] text-[#fbf7ec] sm:text-[2.5rem] sm:leading-[1.08] sm:tracking-[-0.03em]">
            Agricultural <span className="text-[#d8bd55]">Land</span> Marketplace
          </h1>

          <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#d5d9d0] sm:text-[14px]">
            Buy, sell, or lease verified fertile farmland, orchards, and agricultural plots across India with direct seller contact.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {isSeller && (
              <Link
                to="/seller/add-land"
                className="group flex items-center gap-2 rounded-full bg-[#d6b841] px-5 py-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#262c1d] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e0c64d]"
              >
                <Plus className="h-4 w-4" />
                Post Land Listing
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            )}

            <Link
              to="/land/visits"
              className="flex items-center gap-2 rounded-full border border-[#68765e] bg-[#303f26] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#f0ede3] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#394a2d]"
            >
              <CalendarCheck className="h-4 w-4 text-[#d6b841]" />
              My Visit Requests
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-16 -right-5 hidden opacity-[0.13] sm:block lg:right-8">
          <MapPin className="h-56 w-56 text-[#d6b841]" strokeWidth={0.65} />
        </div>
      </section>

      {/* =================================================
          SEARCH & FILTER TOOLBAR
      ================================================= */}

      <div className="mb-6 space-y-3">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-2 rounded-xl border border-[#DEE0D7] bg-white p-2.5 shadow-[0_2px_9px_rgba(30,40,24,0.035)] sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9EA298]" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search land by location, title, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-transparent bg-[#FAFAF7] pl-10 pr-3 text-[13px] font-medium text-[#1E281A] outline-none placeholder:text-[#9EA298] focus:border-[#9EAA8E]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#25321F] px-4 text-[12px] font-extrabold text-white transition-colors hover:bg-[#324029]"
            >
              Search
            </button>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[12px] font-extrabold transition-all duration-200',
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
        </form>

        {/* Deal type tabs + sort */}
        <div className="flex flex-col gap-3 rounded-xl border border-[#DEE0D7] bg-white p-2.5 shadow-[0_2px_9px_rgba(30,40,24,0.035)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg bg-[#FAFAF7] p-1">
            {(['ALL', 'SALE', 'LEASE'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDealType(type)}
                className={cn(
                  'rounded-md px-4 py-1.5 text-[12px] font-extrabold transition',
                  dealType === type ? 'bg-white text-[#1D2819] shadow-sm' : 'text-[#858B7D] hover:text-[#1D2819]',
                )}
              >
                {type === 'ALL' ? 'All Plots' : type === 'SALE' ? 'For Sale' : 'For Lease'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#858B7D] sm:flex">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Sort by
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as LandQueryParams['sortBy'])}
              className="h-9 min-w-[160px] rounded-lg border border-[#DDDED6] bg-[#FAFAF7] px-3 text-[12px] font-extrabold text-[#2C3725] outline-none transition-colors focus:border-[#9EAA8E]"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_asc">Area: Low to High</option>
              <option value="area_desc">Area: High to Low</option>
            </select>
          </div>
        </div>

        {/* Collapsible advanced filters panel */}
        {showFilters && (
          <div className="rounded-xl border border-[#324029] bg-[#25321F] p-4 text-white shadow-lg sm:p-5 animate-in fade-in slide-in-from-top-2">
            <div className="mb-4 flex items-center justify-between border-b border-[#3A4934] pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-[#D5B957]" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#E5E8DF]">
                  Price &amp; area range
                </span>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-bold text-[#B2BFA7] transition-colors hover:text-white"
              >
                Reset
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col">
                <span className="mb-1.5 text-[11px] font-medium text-[#A0AC96]">Min price</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#6D7964]">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/10 bg-white pl-7 pr-3 text-[13px] font-bold text-[#1E281A] outline-none placeholder:font-normal placeholder:text-[#9EA298] focus:border-[#D5B957]"
                  />
                </div>
              </label>

              <label className="flex flex-col">
                <span className="mb-1.5 text-[11px] font-medium text-[#A0AC96]">Max price</span>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#6D7964]">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Any"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-10 w-full rounded-lg border border-white/10 bg-white pl-7 pr-3 text-[13px] font-bold text-[#1E281A] outline-none placeholder:font-normal placeholder:text-[#9EA298] focus:border-[#D5B957]"
                  />
                </div>
              </label>

              <label className="flex flex-col">
                <span className="mb-1.5 text-[11px] font-medium text-[#A0AC96]">Min area (acres)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-white px-3 text-[13px] font-bold text-[#1E281A] outline-none placeholder:font-normal placeholder:text-[#9EA298] focus:border-[#D5B957]"
                />
              </label>

              <label className="flex flex-col">
                <span className="mb-1.5 text-[11px] font-medium text-[#A0AC96]">Max area (acres)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Any"
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-white px-3 text-[13px] font-bold text-[#1E281A] outline-none placeholder:font-normal placeholder:text-[#9EA298] focus:border-[#D5B957]"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#D5B957] px-5 text-[12px] font-black uppercase tracking-[0.06em] text-[#1B2516] transition-colors hover:bg-[#e0c64d]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          MAIN LISTINGS CONTENT
      ================================================= */}

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-[#F3D3CE] bg-[#FDF1EF] p-4 text-xs text-[#B3261E]">
          <span>{error}</span>
          <button type="button" onClick={loadData} className="flex items-center gap-1 font-semibold underline">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-[#E1E4DC] bg-white p-2.5">
              <div className="h-44 w-full rounded-lg bg-[#F3F5EF]" />
              <div className="mt-3 h-4 w-3/4 rounded bg-[#F3F5EF]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[#F3F5EF]" />
              <div className="mt-4 h-6 w-1/3 rounded bg-[#F3F5EF]" />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="mx-auto my-12 max-w-md rounded-3xl border border-dashed border-[#DEE0D7] p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F5EF] text-[#5c744d]">
            <MapPin className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-[#1D2819]">No land listings found</h3>
          <p className="mt-1 text-xs text-[#6C7567]">Try loosening your search filters or check back soon for new plots.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded-full bg-[#25321F] px-4 py-2 text-xs font-extrabold text-white shadow transition-colors hover:bg-[#324029]"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 text-xs font-medium text-[#6C7567]">
            Showing <span className="font-extrabold text-[#1D2819]">{listings.length}</span> {meta ? `of ${meta.totalItems}` : ''} land listings
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((land) => {
              const primaryImg = land.images?.find((img) => img.isPrimary)?.url || land.images?.[0]?.url
              const priceNum = typeof land.price === 'string' ? parseFloat(land.price) : land.price
              const areaNum = typeof land.areaAcres === 'string' ? parseFloat(land.areaAcres) : land.areaAcres

              return (
                <Link
                  key={land.id}
                  to={`/land/${land.slug || land.id}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[#E1E4DC] bg-white p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9D2BF] hover:shadow-[0_8px_24px_rgba(30,45,24,0.09)]"
                >
                  <div>
                    {/* Image / Fallback */}
                    <div className="relative h-44 overflow-hidden rounded-lg bg-[#F3F5EF]">
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={land.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-[#F3F5EF] p-4 text-center">
                          <MapPin className="h-10 w-10 text-[#9EA298]" strokeWidth={1.4} />
                          <span className="mt-2 text-[11px] font-medium text-[#6C7567]">{land.location}</span>
                        </div>
                      )}
                      <span
                        className={cn(
                          'absolute right-2.5 top-2.5 rounded-md px-2 py-1 text-[9px] font-extrabold uppercase leading-none text-white shadow-sm',
                          land.dealType === 'SALE' ? 'bg-[#3E6B3F]' : 'bg-[#B8862E]',
                        )}
                      >
                        For {land.dealType === 'SALE' ? 'Sale' : 'Lease'}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="mt-3 line-clamp-1 text-[15px] font-extrabold text-[#1D2819] transition-colors group-hover:text-[#5c744d]">
                      {land.title}
                    </h2>

                    {/* Meta */}
                    <div className="mt-1.5 space-y-1.5 text-xs text-[#6C7567]">
                      <p className="line-clamp-1 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9EA298]" />
                        <span>{land.location}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="flex items-center gap-1 rounded-md bg-[#F3F5EF] px-2 py-0.5 text-[11px] font-bold text-[#435537]">
                          <Ruler className="h-3 w-3" />
                          {areaNum} Acres
                        </span>
                        {land.soilType && (
                          <span className="flex items-center gap-1 rounded-md bg-[#F5EFE0] px-2 py-0.5 text-[11px] font-medium text-[#8A6A2E]">
                            <Layers className="h-3 w-3" />
                            {land.soilType}
                          </span>
                        )}
                        {land.waterSource && (
                          <span className="flex items-center gap-1 rounded-md bg-[#EAF1F8] px-2 py-0.5 text-[11px] font-medium text-[#2E5F8A]">
                            <Droplets className="h-3 w-3" />
                            {land.waterSource}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="mt-3 flex items-end justify-between border-t border-[#F0F1EA] pt-3">
                    <div>
                      <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#9EA298]">
                        {land.dealType === 'LEASE' ? 'Annual Rent' : 'Total Price'}
                      </p>
                      <p className="text-[17px] font-black text-[#1D2819]">
                        {formatINR(priceNum)}
                        {land.dealType === 'LEASE' && <span className="text-xs font-medium text-[#9EA298]">/yr</span>}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 rounded-lg bg-[#F3F5EF] px-3 py-1.5 text-[11px] font-extrabold text-[#5c744d] transition-colors group-hover:bg-[#25321F] group-hover:text-white">
                      View
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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