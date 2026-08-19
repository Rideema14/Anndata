import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { SelectField } from '@/components/common/FormField'
import { generatePriceHistory, mandiCrops, mockMandiRecords } from '@/data/mock/mockMandiData'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const RANGES = [
  { key: '7d', label: '7 Days', days: 7 },
  { key: '30d', label: '30 Days', days: 30 },
  { key: '3m', label: '3 Months', days: 90 },
]

export default function MandiHistoryPage() {
  const [searchParams] = useSearchParams()
  const allMandis = [...new Set(mockMandiRecords.map((r) => r.mandi))]
  const [crop, setCrop] = useState(searchParams.get('crop') ?? mandiCrops[0])
  const [mandi, setMandi] = useState(searchParams.get('mandi') ?? allMandis[0])
  const [range, setRange] = useState(RANGES[0])

  const data = useMemo(() => {
    const points = generatePriceHistory(crop, mandi, range.days)
    return points.map((p) => ({
      label:
        range.key === '7d'
          ? new Date(p.date).toLocaleDateString('en-IN', { weekday: 'short' })
          : new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      price: p.price,
    }))
  }, [crop, mandi, range])

  const latest = data[data.length - 1]?.price ?? 0
  const earliest = data[0]?.price ?? 0
  const change = earliest ? ((latest - earliest) / earliest) * 100 : 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Price History</h1>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <SelectField id="crop" label="Crop" value={crop} onChange={(e) => setCrop(e.target.value)}>
          {mandiCrops.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </SelectField>
        <SelectField id="mandi" label="Mandi" value={mandi} onChange={(e) => setMandi(e.target.value)}>
          {allMandis.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </SelectField>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-ink-900">{formatINR(latest)}</p>
            <p className={cn('text-xs font-semibold', change >= 0 ? 'text-brand-600' : 'text-danger-500')}>
              {change >= 0 ? '+' : ''}
              {change.toFixed(1)}% over {range.label.toLowerCase()}
            </p>
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

        <div className="h-64 w-full">
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
