import { Link } from 'react-router-dom'
import { ClipboardList, Sprout } from 'lucide-react'
import { useSeedCart } from '@/context/SeedCartContext'
import { formatDateLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  placed: 'bg-ink-100 text-ink-600',
  confirmed: 'bg-sky-50 text-sky-700',
  packed: 'bg-gold-50 text-gold-700',
  shipped: 'bg-brand-50 text-brand-700',
  delivered: 'bg-brand-100 text-brand-800',
}

export default function SeedOrdersPage() {
  const { seedOrders } = useSeedCart()

  if (seedOrders.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <ClipboardList className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="text-lg">No seed orders yet</h1>
        <Link to="/seeds" className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Browse Seed Store
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Seed Orders</h1>
      <div className="space-y-3">
        {seedOrders.map((order) => (
          <div key={order.id} className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-surface p-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-sunk text-brand-600">
              <Sprout className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">#{order.id}</p>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', STATUS_STYLES[order.status])}>
                  {order.status}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-ink-500">{order.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-ink-400">{formatDateLabel(order.placedAt)}</span>
                <span className="font-semibold text-ink-800">{formatINR(order.total)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
