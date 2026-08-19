import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { IndianRupee, List, PackageCheck, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/common/StatCard'
import { useSeller } from '@/context/SellerContext'
import { salesTrend, topProducts } from '@/data/mock/mockSellerAnalytics'
import { formatINR, formatNumberIN } from '@/utils/format'

export default function SellerDashboardPage() {
  const { listings, sellerOrders } = useSeller()
  const activeListings = listings.filter((l) => l.status === 'active').length
  const pendingOrders = sellerOrders.filter((o) => o.status !== 'delivered').length
  const totalRevenue = salesTrend.reduce((sum, m) => sum + m.revenue, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Seller Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active Listings" value={String(activeListings)} icon={List} accent="bg-brand-50 text-brand-700" />
        <StatCard label="Orders to Fulfill" value={String(pendingOrders)} icon={PackageCheck} accent="bg-gold-50 text-gold-700" />
        <StatCard label="Revenue (6mo)" value={formatINR(totalRevenue)} icon={IndianRupee} trend="+18.2%" accent="bg-sky-50 text-sky-700" />
        <StatCard label="Units Sold" value={formatNumberIN(topProducts.reduce((s, p) => s + p.unitsSold, 0))} icon={TrendingUp} trend="+9.4%" accent="bg-soil-50 text-soil-700" />
      </div>

      <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Sales Trend</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
              <Bar dataKey="sales" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Revenue Trend</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
                <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="var(--color-gold-400)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Top Products</h2>
          <ul className="space-y-2">
            {topProducts.map((p, index) => (
              <li key={p.name} className="flex items-center justify-between text-sm">
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
        </div>
      </div>

      <Link to="/seller/analytics" className="mt-5 block text-center text-xs font-semibold text-brand-600 hover:underline">
        View full analytics →
      </Link>
    </div>
  )
}
