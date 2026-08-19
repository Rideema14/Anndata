import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { platformStats } from '@/data/mock/mockAdminData'
import { salesTrend } from '@/data/mock/mockSellerAnalytics'
import { formatINR } from '@/utils/format'

export default function AdminAnalyticsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Platform Analytics</h1>

      <div className="rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Monthly GMV</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformStats.monthlyGmv} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
              <Bar dataKey="gmv" fill="var(--color-brand-500)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Platform-wide Order Volume (mirrors seller trend data)</h2>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesTrend} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
              <Bar dataKey="sales" fill="var(--color-gold-400)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
