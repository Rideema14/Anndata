import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { IndianRupee, List, PackageCheck, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/common/StatCard'
import { sellerService, type SellerAnalytics, type SellerDashboard } from '@/services/sellerService'
import { formatINR, formatNumberIN } from '@/utils/format'

export default function SellerDashboardPage() {
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null)
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([sellerService.getDashboard(), sellerService.getAnalytics(90, 5)]).then(([d, a]) => {
      if (cancelled) return
      setDashboard(d)
      setAnalytics(a)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const chartData = analytics?.salesTrend.map((point) => ({
    ...point,
    dayLabel: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(point.date)),
  }))
  const totalUnitsSold = analytics?.topProducts.reduce((sum, p) => sum + p.unitsSold, 0) ?? 0

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Seller Dashboard</h1>

      {!dashboard || !analytics ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Active Listings" value={String(dashboard.activeListings)} icon={List} accent="bg-brand-50 text-brand-700" />
            <StatCard label="Orders to Fulfill" value={String(dashboard.ordersToFulfill)} icon={PackageCheck} accent="bg-gold-50 text-gold-700" />
            <StatCard label="Revenue (30d)" value={formatINR(dashboard.revenueLast30Days)} icon={IndianRupee} accent="bg-sky-50 text-sky-700" />
            <StatCard label="Units Sold (90d)" value={formatNumberIN(totalUnitsSold)} icon={TrendingUp} accent="bg-soil-50 text-soil-700" />
          </div>

          <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-800">Sales Trend (90 days)</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
                  <Bar dataKey="orderCount" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-ink-100 bg-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink-800">Revenue Trend</h2>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
                    <XAxis dataKey="dayLabel" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
                    <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="var(--color-gold-400)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-ink-100 bg-surface p-4">
              <h2 className="mb-3 text-sm font-semibold text-ink-800">Top Products</h2>
              {analytics.topProducts.length === 0 ? (
                <p className="text-xs text-ink-400">No sales yet.</p>
              ) : (
                <ul className="space-y-2">
                  {analytics.topProducts.map((p, index) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-ink-700">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-sunk text-[10px] font-bold text-ink-500">
                          {index + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="text-xs text-ink-400">{p.unitsSold} sold</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Link to="/seller/analytics" className="mt-5 block text-center text-xs font-semibold text-brand-600 hover:underline">
            View full analytics →
          </Link>
        </>
      )}
    </div>
  )
}
