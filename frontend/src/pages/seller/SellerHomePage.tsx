import { Link } from 'react-router-dom'
import { BarChart3, LayoutDashboard, List, MapPin, PackageCheck, PlusSquare, Store, Tractor } from 'lucide-react'
import { useSeller } from '@/context/SellerContext'

const TOOLS = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'bg-brand-50 text-brand-700' },
  { to: '/seller/listings', label: 'My Listings', icon: List, color: 'bg-gold-50 text-gold-700' },
  { to: '/seller/add-product', label: 'Add Product', icon: PlusSquare, color: 'bg-sky-50 text-sky-700' },
  { to: '/seller/add-land', label: 'List Land', icon: MapPin, color: 'bg-soil-50 text-soil-700' },
  { to: '/seller/add-machinery', label: 'List Machinery', icon: Tractor, color: 'bg-soil-50 text-soil-700' },
  { to: '/seller/orders', label: 'Orders to Fulfill', icon: PackageCheck, color: 'bg-brand-50 text-brand-700' },
  { to: '/seller/analytics', label: 'Analytics', icon: BarChart3, color: 'bg-danger-50 text-danger-500' },
]

export default function SellerHomePage() {
  const { listings, sellerOrders } = useSeller()
  const activeCount = listings.filter((l) => l.isActive !== false).length
  const pendingOrders = sellerOrders.filter((o) => o.status !== 'delivered').length

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700 text-white">
          <Store className="h-5.5 w-5.5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl">Seller Hub</h1>
          <p className="text-xs text-ink-500">{activeCount} active listings · {pendingOrders} orders to fulfill</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="flex flex-col gap-2 rounded-2xl border border-ink-100 bg-surface p-4 transition-transform hover:-translate-y-0.5 hover:shadow-card"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tool.color}`}>
              <tool.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-ink-900">{tool.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
