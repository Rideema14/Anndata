import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { IndianRupee, MousePointerClick, ShoppingCart, TrendingUp } from 'lucide-react'
import { StatCard } from '@/components/common/StatCard'
import { conversionMetrics, salesTrend, topProducts } from '@/data/mock/mockSellerAnalytics'
import { formatINR, formatNumberIN } from '@/utils/format'

export default function SellerAnalyticsPage() {
  const totalRevenue = salesTrend.reduce((s, m) => s + m.revenue, 0)
  const totalSales = salesTrend.reduce((s, m) => s + m.sales, 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Seller Analytics</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Revenue" value={formatINR(totalRevenue)} icon={IndianRupee} trend="+18.2%" accent="bg-brand-50 text-brand-700" />
        <StatCard label="Total Sales" value={formatNumberIN(totalSales)} icon={TrendingUp} trend="+11.6%" accent="bg-gold-50 text-gold-700" />
        <StatCard label="Orders Placed" value={formatNumberIN(conversionMetrics.ordersPlaced)} icon={ShoppingCart} accent="bg-sky-50 text-sky-700" />
        <StatCard
          label="Conversion Rate"
          value={`${conversionMetrics.conversionRatePercent}%`}
          icon={MousePointerClick}
          accent="bg-soil-50 text-soil-700"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Revenue Over Time</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
              <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="var(--color-brand-600)" fill="url(#revenueFill)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Top Products</h2>
        <div className="divide-y divide-ink-100">
          {topProducts.map((p) => (
            <div key={p.name} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink-700">{p.name}</span>
              <span className="text-ink-400">{p.unitsSold} units</span>
              <span className="font-semibold text-ink-900">{formatINR(p.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-surface-sunk p-4 text-xs text-ink-500">
        Funnel: {formatNumberIN(conversionMetrics.visitors)} visitors → {formatNumberIN(conversionMetrics.addedToCart)} added to cart →{' '}
        {formatNumberIN(conversionMetrics.ordersPlaced)} orders placed.
      </div>
    </div>
  )
}
