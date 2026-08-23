import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { adminService, type PlatformAnalytics } from '@/services/adminService'
import { formatINR } from '@/utils/format'

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<PlatformAnalytics | null>(null)

  useEffect(() => {
    let cancelled = false
    adminService.getAnalytics(12).then((data) => {
      if (!cancelled) setStats(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const gmvData = stats?.monthlyGmv.map((m) => ({
    ...m,
    monthLabel: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(m.month)),
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Platform Analytics</h1>

      {!stats ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : (
        <>
          <div className="rounded-2xl border border-ink-100 bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-800">Monthly GMV</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gmvData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
                  <Bar dataKey="gmv" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-800">Monthly Order Count</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gmvData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
                  <Bar dataKey="orderCount" fill="var(--color-gold-400)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-800">Orders by Status</h2>
            <div className="flex flex-wrap gap-2">
              {stats.orderStatusBreakdown.map((row) => (
                <span key={row.status} className="rounded-full bg-surface-sunk px-3 py-1.5 text-xs font-medium text-ink-700">
                  {row.status.toLowerCase()}: <strong className="text-ink-900">{row.count}</strong>
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
