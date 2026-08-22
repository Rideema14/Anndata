import { PackageCheck, User } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useSeller } from '@/context/SellerContext'
import { formatDateLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  placed: 'bg-ink-100 text-ink-600',
  confirmed: 'bg-sky-50 text-sky-700',
  packed: 'bg-gold-50 text-gold-700',
  shipped: 'bg-brand-50 text-brand-700',
  delivered: 'bg-brand-100 text-brand-800',
}

const NEXT_ACTION_LABEL: Record<string, string> = {
  placed: 'Confirm Order',
  confirmed: 'Mark Packed',
  packed: 'Mark Shipped',
  shipped: 'Mark Delivered',
}

export default function SellerOrdersPage() {
  const { sellerOrders, isLoadingOrders, advanceSellerOrderStatus } = useSeller()

  if (isLoadingOrders && sellerOrders.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-400">Loading…</p>
      </div>
    )
  }

  if (sellerOrders.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <PackageCheck className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <p className="text-sm text-ink-500">No orders to fulfill yet.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Orders to Fulfill</h1>
      <div className="space-y-3">
        {sellerOrders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-ink-100 bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-900">#{order.id}</p>
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', STATUS_STYLES[order.status])}>
                {order.status}
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {order.buyerName}
            </p>
            <p className="mt-1 text-xs text-ink-500">{order.itemsLabel}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-ink-400">{formatDateLabel(order.placedAt)}</span>
              <span className="text-sm font-bold text-ink-900">{formatINR(order.total)}</span>
            </div>
            {order.status !== 'delivered' && (
              <Button variant="secondary" className="mt-3 h-9 px-4 text-xs" onClick={() => advanceSellerOrderStatus(order.id)}>
                {NEXT_ACTION_LABEL[order.status]}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
