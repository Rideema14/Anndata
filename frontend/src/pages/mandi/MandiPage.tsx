import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Heart, History } from 'lucide-react'
import { SelectField } from '@/components/common/FormField'
import {
  mandiCrops,
  mandiDistrictsForState,
  mandiStates,
  mandisForDistrict,
  mockMandiRecords,
} from '@/data/mock/mockMandiData'
import { useMandi } from '@/context/MandiContext'
import { formatDateLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function MandiPage() {
  const [state, setState] = useState(mandiStates[0])
  const districts = useMemo(() => mandiDistrictsForState(state), [state])
  const [district, setDistrict] = useState(districts[0])
  const mandis = useMemo(() => mandisForDistrict(district), [district])
  const [mandi, setMandi] = useState(mandis[0])
  const [crop, setCrop] = useState('All')
  const { isFavorite, toggleFavorite } = useMandi()

  useEffect(() => {
    setDistrict(mandiDistrictsForState(state)[0])
  }, [state])

  useEffect(() => {
    setMandi(mandisForDistrict(district)[0])
  }, [district])

  const results = mockMandiRecords.filter(
    (r) => r.state === state && r.district === district && r.mandi === mandi && (crop === 'All' || r.crop === crop),
  )

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
          {mandiStates.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectField>
        <SelectField id="district" label="District" value={district} onChange={(e) => setDistrict(e.target.value)}>
          {districts.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </SelectField>
        <SelectField id="mandi" label="Mandi" value={mandi} onChange={(e) => setMandi(e.target.value)}>
          {mandis.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </SelectField>
        <SelectField id="crop" label="Crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
          <option>All</option>
          {mandiCrops.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
      </div>

      <div className="space-y-2">
        {results.map((row) => {
          const favorited = isFavorite(row.crop, row.mandi)
          return (
            <div key={row.crop} className="flex items-center justify-between rounded-2xl border border-ink-100 bg-surface p-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">{row.crop}</p>
                <p className="text-xs text-ink-400">
                  {row.mandi} · Updated {formatDateLabel(row.updatedAt)}
                </p>
                <p className="mt-1 text-[11px] text-ink-400">
                  Range: {formatINR(row.minPrice)} – {formatINR(row.maxPrice)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold text-ink-900">{formatINR(row.price)}</p>
                  <Link
                    to={`/mandi/history?crop=${encodeURIComponent(row.crop)}&mandi=${encodeURIComponent(row.mandi)}`}
                    className="flex items-center justify-end gap-1 text-[11px] font-medium text-brand-600 hover:underline"
                  >
                    <History className="h-3 w-3" aria-hidden="true" />
                    History
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(row.crop, row.mandi)}
                  aria-pressed={favorited}
                  aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-100"
                >
                  <Heart className={cn('h-4 w-4', favorited ? 'fill-danger-500 text-danger-500' : 'text-ink-400')} aria-hidden="true" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
