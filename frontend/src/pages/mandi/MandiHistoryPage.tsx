import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SelectField } from '@/components/common/FormField'
import { mandiService } from '@/services/mandiService'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

const RANGES = [
  { key: '7d', label: '7 Days', days: 7 },
  { key: '30d', label: '30 Days', days: 30 },
  { key: '3m', label: '3 Months', days: 90 },
]

export default function MandiHistoryPage() {
  const [searchParams] = useSearchParams()
  const initialCropId = searchParams.get('cropId') || ''
  const initialMandiId = searchParams.get('mandiId') || ''

  const [crops, setCrops] = useState<{ id: string; name: string }[]>([])
  const [mandis, setMandis] = useState<{ id: string; name: string }[]>([])

  const [cropId, setCropId] = useState(initialCropId)
  const [mandiId, setMandiId] = useState(initialMandiId)
  const [range, setRange] = useState(RANGES[0])

  const [historyData, setHistoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Initial Form Options
  useEffect(() => {
    async function init() {
      try {
        const [cropsRes, mandisRes] = await Promise.all([
          mandiService.getCrops(),
          mandiService.getMarkets()
        ])
        const c = cropsRes.data || cropsRes || []
        const m = mandisRes.data?.items || mandisRes.data?.data || mandisRes.data || mandisRes || []
        setCrops(c)
        setMandis(m)
        if (!initialCropId && c.length > 0) setCropId(c[0].id)
        if (!initialMandiId && m.length > 0) setMandiId(m[0].id)
      } catch (err) {
        console.error('Failed to load history form options', err)
      }
    }
    init()
  }, [initialCropId, initialMandiId])

  // Fetch History
  useEffect(() => {
    if (!cropId || !mandiId) return
    let cancel = false

    async function fetchHistory() {
      setLoading(true)
      try {
        const res = await mandiService.getPriceHistory({ cropId, mandiId, days: range.days })
        if (!cancel) {
          setHistoryData(res.data || res || [])
        }
      } catch (err) {
        console.error('Failed to fetch history', err)
      } finally {
        if (!cancel) setLoading(false)
      }
    }

    fetchHistory()
    return () => { cancel = true }
  }, [cropId, mandiId, range])

  const data = useMemo(() => {
    return historyData.map((p: any) => ({
      label:
        range.key === '7d'
          ? new Date(p.priceDate).toLocaleDateString('en-IN', { weekday: 'short' })
          : new Date(p.priceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      price: Number(p.modalPrice),
    }))
  }, [historyData, range])

  const latest = data[data.length - 1]?.price ?? 0
  const earliest = data[0]?.price ?? 0
  const change = earliest ? ((latest - earliest) / earliest) * 100 : 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Price History</h1>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <SelectField id="crop" label="Crop" value={cropId} onChange={(e) => setCropId(e.target.value)}>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </SelectField>
        <SelectField id="mandi" label="Mandi" value={mandiId} onChange={(e) => setMandiId(e.target.value)}>
          {mandis.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </SelectField>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-ink-900">{latest ? formatINR(latest) : '--'}</p>
            {!!earliest && (
              <p className={cn('text-xs font-semibold', change >= 0 ? 'text-brand-600' : 'text-danger-500')}>
                {change >= 0 ? '+' : ''}
                {change.toFixed(1)}% over {range.label.toLowerCase()}
              </p>
            )}
          </div>
          <div className="flex gap-1 rounded-full bg-surface-sunk p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  range.key === r.key ? 'bg-brand-600 text-white' : 'text-ink-500',
                )}
              >
                {r.key}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/50 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            </div>
          )}
          {data.length === 0 && !loading && (
            <div className="absolute inset-0 flex items-center justify-center text-ink-400">
              No data for this range.
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }}
                interval={range.key === '3m' ? 12 : range.key === '30d' ? 4 : 0}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} width={44} domain={['dataMin - 50', 'dataMax + 50']} />
              <Tooltip
                formatter={(value) => [formatINR(Number(Array.isArray(value) ? value[0] : (value ?? 0))), 'Price']}
                contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="price" stroke="var(--color-brand-600)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
