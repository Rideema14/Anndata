import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Heart, History, Loader2, Search } from 'lucide-react'
import { SelectField } from '@/components/common/FormField'
import { useMandi } from '@/context/MandiContext'
import { mandiService } from '@/services/mandiService'
import { formatDateLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

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

export default function MandiPage() {
  const [states, setStates] = useState<string[]>([])
  const [districts, setDistricts] = useState<string[]>([])
  const [mandis, setMandis] = useState<{ id: string; name: string }[]>([])
  const [crops, setCrops] = useState<{ id: string; name: string }[]>([])

  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [mandiId, setMandiId] = useState('')
  const [cropId, setCropId] = useState('')

  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { isFavorite, toggleFavorite } = useMandi()

  // 1. Load filter options + all prices on mount
  useEffect(() => {
    async function init() {
      try {
        const [statesRes, cropsRes, pricesRes] = await Promise.all([
          mandiService.getStates(),
          mandiService.getCrops(),
          mandiService.getPrices({ limit: 50 }),
        ])
        setStates(unwrapArray(statesRes))
        setCrops(unwrapArray(cropsRes))
        setPrices(unwrapArray(pricesRes))
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

  // 4. Refetch prices when filters change (skip on initial mount — handled above)
  const [initialLoad, setInitialLoad] = useState(true)
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false)
      return
    }

    const params: Record<string, any> = { limit: 50 }
    // Only pass non-empty filter values — empty strings cause the backend
    // to filter for literally empty state/district which matches nothing.
    if (state) params.state = state
    if (district) params.district = district
    if (mandiId) params.mandiId = mandiId
    if (cropId) params.cropId = cropId

    setLoading(true)
    const t = setTimeout(() => {
      mandiService.getPrices(params)
        .then((res) => setPrices(unwrapArray(res)))
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [state, district, mandiId, cropId])

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

      <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-ink-100 bg-surface p-4 sm:grid-cols-4">
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
          <option value="">{district ? 'All Mandis' : 'Select District First'}</option>
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
      </div>

      <div className="space-y-2">
        {loading && <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-ink-400" /></div>}
        
        {!loading && prices.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-ink-100 bg-surface p-8 text-center text-ink-500">
            <Search className="mb-2 h-8 w-8 text-ink-300" />
            No prices found for the selected filters.
          </div>
        )}

        {!loading && prices.map((row) => {
          const mId = row.mandiId || row.mandi?.id
          const cId = row.cropId || row.crop?.id
          const favorited = isFavorite(mId)
          return (
            <div key={row.id} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">{row.crop?.name || 'Unknown Crop'}</p>
                <p className="text-xs text-ink-400">
                  {row.mandi?.name || 'Unknown Mandi'} · {row.mandi?.district}, {row.mandi?.state} · {formatDateLabel(row.priceDate)}
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
      </div>
    </div>
  )
}
