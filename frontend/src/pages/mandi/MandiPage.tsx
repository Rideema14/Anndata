import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Heart, History, Loader2, Search } from 'lucide-react'
import { SelectField } from '@/components/common/FormField'
import { useMandi } from '@/context/MandiContext'
import { mandiService } from '@/services/mandiService'
import { formatDateLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 15

/**
 * Safely extract the array from any of the response shapes the backend may use:
 *   ApiResponse.ok     → { success, data: T[] }
 *   ApiResponse.paginated → { success, data: T[], meta }
 * After Axios + mandiService, we receive the inner { success, data, meta } object.
 */
function unwrapArray(res: any): any[] {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  return []
}

function unwrapMeta(res: any): any {
  if (res?.meta?.pagination) return res.meta.pagination
  if (res?.meta) return res.meta
  return null
}

export default function MandiPage() {
  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [mandis, setMandis] = useState<{ id: string; name: string }[]>([])
  const [crops, setCrops] = useState<{ id: string; name: string }[]>([])

  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [mandiId, setMandiId] = useState('')
  const [cropId, setCropId] = useState('')
  const [exactDate, setExactDate] = useState('')

  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const { isFavorite, toggleFavorite } = useMandi()

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // 1. Load filter options on mount (no prices on mount)
  useEffect(() => {
    async function init() {
      try {
        const [statesRes, cropsRes] = await Promise.all([
          mandiService.getStates(),
          mandiService.getCrops(),
        ])
        setStates(unwrapArray(statesRes))
        setCrops(unwrapArray(cropsRes))
      } catch (err) {
        console.error('Failed to load mandi data', err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // 2. Fetch districts when state changes
  useEffect(() => {
    if (!state) {
      setDistricts([])
      setDistrict('')
      return
    }
    mandiService.getDistricts(state).then((res) => {
      setDistricts(unwrapArray(res))
      setDistrict('')
    }).catch(console.error)
  }, [state])

  // 3. Fetch mandis when district changes
  useEffect(() => {
    if (!district || !state) {
      setMandis([])
      setMandiId('')
      return
    }
    mandiService.getMarkets({ state, district }).then((res) => {
      setMandis(unwrapArray(res))
      setMandiId('')
    }).catch(console.error)
  }, [district, state])

  // 4. Auto-fetch prices when mandiId is selected (or cropId changes)
  useEffect(() => {
    if (!mandiId) {
      setPrices([])
      setCurrentPage(1)
      setHasMore(false)
      return
    }

    const params: Record<string, any> = { limit: PAGE_SIZE, page: 1 }
    if (state) params.state = state
    if (district) params.district = district
    params.mandiId = mandiId
    if (cropId) params.cropId = cropId
    if (exactDate) params.exactDate = exactDate

    setLoading(true)
    setCurrentPage(1)
    setHasMore(false)

    const t = setTimeout(() => {
      mandiService.getPrices(params)
        .then((res) => {
          const items = unwrapArray(res)
          setPrices(items)
          const meta = unwrapMeta(res)
          if (meta && meta.totalPages > 1) {
            setHasMore(true)
          } else {
            setHasMore(false)
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(t)
  }, [mandiId, cropId, exactDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // 5. Load more prices (infinite scroll)
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || !mandiId) return

    const nextPage = currentPage + 1
    const params: Record<string, any> = { limit: PAGE_SIZE, page: nextPage }
    if (state) params.state = state
    if (district) params.district = district
    params.mandiId = mandiId
    if (cropId) params.cropId = cropId
    if (exactDate) params.exactDate = exactDate

    setLoadingMore(true)
    mandiService.getPrices(params)
      .then((res) => {
        const items = unwrapArray(res)
        setPrices((prev) => [...prev, ...items])
        setCurrentPage(nextPage)
        const meta = unwrapMeta(res)
        if (meta && nextPage >= meta.totalPages) {
          setHasMore(false)
        } else if (items.length < PAGE_SIZE) {
          setHasMore(false)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false))
  }, [loadingMore, hasMore, mandiId, currentPage, state, district, cropId, exactDate])

  // 6. IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl">Mandi Prices</h1>
        <div className="flex gap-2">
          <Link to="/mandi/favorites" className="flex items-center gap-1 rounded-full border border-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            Favorites
          </Link>
          <Link to="/mandi/alerts" className="flex items-center gap-1 rounded-full border border-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
            <Bell className="h-3.5 w-3.5" aria-hidden="true" />
            Alerts
          </Link>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-ink-100 bg-surface p-4 md:grid-cols-5">
        <SelectField id="state" label="State" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </SelectField>
        <SelectField id="district" label="District" value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!state}>
          <option value="">{state ? 'All Districts' : 'Select State First'}</option>
          {districts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </SelectField>
        <SelectField id="mandi" label="Mandi" value={mandiId} onChange={(e) => setMandiId(e.target.value)} disabled={!district}>
          <option value="">{district ? 'Select a Mandi' : 'Select District First'}</option>
          {mandis.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </SelectField>
        <SelectField id="crop" label="Crop" value={cropId} onChange={(e) => setCropId(e.target.value)}>
          <option value="">All Crops</option>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectField>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="exactDate" className="text-sm font-medium text-ink-700">Date (Optional)</label>
          <input
            type="date"
            id="exactDate"
            value={exactDate}
            onChange={(e) => setExactDate(e.target.value)}
            className="flex h-10 w-full items-center rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400"
          />
        </div>
      </div>

      {/* Prompt user to select a mandi if none is selected */}
      {!mandiId && !loading && (
        <div className="flex flex-col items-center rounded-2xl border border-ink-100 bg-surface p-8 text-center text-ink-500">
          <Search className="mb-2 h-8 w-8 text-ink-300" />
          Select a State → District → Mandi to view live prices
        </div>
      )}

      <div className="space-y-2">
        {loading && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-ink-400" /></div>}
        
        {!loading && mandiId && prices.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-ink-100 bg-surface p-8 text-center text-ink-500">
            <Search className="mb-2 h-8 w-8 text-ink-300" />
            No prices found for the selected filters.
          </div>
        )}

        {!loading && prices.map((row, idx) => {
          const mId = row.mandiId || row.mandi?.id
          const cId = row.cropId || row.crop?.id
          const favorited = isFavorite(mId)
          return (
            <div key={`${row.id}-${idx}`} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">{row.crop?.name || 'Unknown Crop'}</p>
                <p className="text-xs text-ink-400">
                  {row.mandi?.name || 'Unknown Mandi'} · {row.mandi?.district}, {row.mandi?.state} · {row.variety || ''} · {formatDateLabel(row.priceDate)}
                </p>
                <p className="mt-1 text-[11px] text-ink-400">
                  Range: {formatINR(row.minPrice)} – {formatINR(row.maxPrice)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold text-ink-900">{formatINR(row.modalPrice)}</p>
                  {mId && cId && (
                    <Link
                      to={`/mandi/history?cropId=${cId}&mandiId=${mId}`}
                      className="flex items-center justify-end gap-1 text-[11px] font-medium text-brand-600 hover:underline"
                    >
                      <History className="h-3 w-3" aria-hidden="true" />
                      History
                    </Link>
                  )}
                </div>
                {mId && (
                  <button
                    type="button"
                    onClick={() => toggleFavorite(mId)}
                    aria-pressed={favorited}
                    aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-100"
                  >
                    <Heart className={cn('h-4 w-4', favorited ? 'fill-danger-500 text-danger-500' : 'text-ink-400')} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Infinite scroll: loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-ink-400" />
          </div>
        )}

        {/* Invisible sentinel element for IntersectionObserver */}
        {hasMore && <div ref={sentinelRef} className="h-4" />}

        {/* End of results */}
        {!loading && !hasMore && prices.length > 0 && (
          <p className="py-3 text-center text-xs text-ink-400">
            Showing {prices.length} results
          </p>
        )}
      </div>
    </div>
  )
}
