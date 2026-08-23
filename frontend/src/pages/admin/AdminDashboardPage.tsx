import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { IndianRupee, PackageCheck, Store, Users } from 'lucide-react'
import { StatCard } from '@/components/common/StatCard'
import { adminService, type PlatformAnalytics } from '@/services/adminService'
import { formatINR, formatNumberIN } from '@/utils/format'

const LINKS = [
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/sellers', label: 'Sellers' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/seeds', label: 'Seed Management' },
  { to: '/admin/analytics', label: 'Analytics' },
]

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformAnalytics | null>(null)

  useEffect(() => {
    let cancelled = false
    adminService.getAnalytics().then((data) => {
      if (!cancelled) setStats(data)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const chartData = stats?.monthlyGmv.map((m) => ({
    ...m,
    monthLabel: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(m.month)),
  }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Admin Dashboard</h1>

      {!stats ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Users" value={formatNumberIN(stats.totalUsers)} icon={Users} accent="bg-brand-50 text-brand-700" />
            <StatCard label="Total Sellers" value={formatNumberIN(stats.totalSellers)} icon={Store} accent="bg-gold-50 text-gold-700" />
            <StatCard label="Total Orders" value={formatNumberIN(stats.totalOrders)} icon={PackageCheck} accent="bg-sky-50 text-sky-700" />
            <StatCard label="GMV" value={formatINR(stats.gmv)} icon={IndianRupee} accent="bg-soil-50 text-soil-700" />
          </div>

          <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ink-800">GMV Trend</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ink-100)" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-400)' }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid var(--color-ink-100)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="gmv" stroke="var(--color-brand-600)" fill="url(#gmvFill)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="rounded-2xl border border-ink-100 bg-surface p-4 text-center text-sm font-medium text-ink-700 hover:border-brand-300 hover:text-brand-700">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
