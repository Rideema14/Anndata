import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Package, Search } from 'lucide-react'
import { adminService, type AdminOrderListItem, type AdminOrderStatus, type AdminPaymentStatus, type AdminSettlementStatus } from '@/services/adminService'
import { formatDateTimeLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 20

const ORDER_STATUS_OPTIONS: AdminOrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'CANCELLED',
  'RETURNED',
  'DISPUTED',
]

const SETTLEMENT_STATUS_OPTIONS: AdminSettlementStatus[] = [
  'NOT_ELIGIBLE',
  'PENDING_REVIEW',
  'SELLER_PAYOUT_PENDING',
  'SELLER_PAID',
  'BUYER_REFUND_PENDING',
  'BUYER_REFUNDED',
]

const ORDER_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-ink-100 text-ink-600',
  CONFIRMED: 'bg-sky-50 text-sky-700',
  PROCESSING: 'bg-gold-50 text-gold-700',
  SHIPPED: 'bg-brand-50 text-brand-700',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-brand-100 text-brand-800',
  DELIVERY_FAILED: 'bg-danger-50 text-danger-600',
  CANCELLED: 'bg-ink-100 text-ink-500',
  RETURNED: 'bg-danger-50 text-danger-600',
  DISPUTED: 'bg-amber-100 text-amber-800',
}

const SETTLEMENT_STYLES: Record<string, string> = {
  NOT_ELIGIBLE: 'bg-ink-100 text-ink-500',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  SELLER_PAYOUT_PENDING: 'bg-sky-50 text-sky-700',
  SELLER_PAID: 'bg-brand-100 text-brand-800',
  BUYER_REFUND_PENDING: 'bg-sky-50 text-sky-700',
  BUYER_REFUNDED: 'bg-brand-100 text-brand-800',
}

function label(value: string): string {
  return value.replace(/_/g, ' ').toLowerCase()
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AdminOrderStatus | ''>('')
  const [settlementStatus, setSettlementStatus] = useState<AdminSettlementStatus | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<AdminPaymentStatus | ''>('')

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const { items, totalItems: total } = await adminService.listAllOrders({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status || undefined,
        settlementStatus: settlementStatus || undefined,
        paymentStatus: paymentStatus || undefined,
      })
      setOrders(items)
      setTotalItems(total)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, status, settlementStatus, paymentStatus])

  // Debounce so typing in the search box doesn't fire a request per keystroke; filter/page changes reuse the same debounce for simplicity.
  useEffect(() => {
    const t = setTimeout(() => load(), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, settlementStatus, paymentStatus, search])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 flex items-center gap-2 text-xl">
        <Package className="h-5 w-5 text-brand-600" aria-hidden="true" />
        All Orders
      </h1>
      <p className="mb-5 text-sm text-ink-500">
        Every order on the platform. Shipment status here is exactly what the seller submitted — verify delivery yourself via the
        courier's official tracking link before settling an order.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Order #, AWB, seller, or buyer"
            className="h-10 w-full rounded-xl border border-ink-200 bg-surface pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as AdminOrderStatus | '')
            setPage(1)
          }}
          className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-xs text-ink-700 focus:border-brand-400"
        >
          <option value="">All statuses</option>
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s} className="capitalize">
              {label(s)}
            </option>
          ))}
        </select>
        <select
          value={settlementStatus}
          onChange={(e) => {
            setSettlementStatus(e.target.value as AdminSettlementStatus | '')
            setPage(1)
          }}
          className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-xs text-ink-700 focus:border-brand-400"
        >
          <option value="">All settlements</option>
          {SETTLEMENT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <select
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value as AdminPaymentStatus | '')
            setPage(1)
          }}
          className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-xs text-ink-700 focus:border-brand-400"
        >
          <option value="">All payments</option>
          {(['CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'] as AdminPaymentStatus[]).map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-ink-400">{totalItems} order{totalItems === 1 ? '' : 's'}</span>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-500">No orders match these filters.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">AWB / Courier</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Settlement</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.map((o) => (
                <tr key={o.id} className={o.disputes.length > 0 ? 'bg-amber-50/40' : undefined}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">#{o.orderNumber}</p>
                    <p className="text-xs text-ink-500">
                      {formatDateTimeLabel(o.createdAt)} · {formatINR(Number(o.totalAmount))}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-600">
                    {o.shipment ? (
                      <>
                        <p className="font-medium text-ink-800">{o.shipment.awb}</p>
                        <p>{o.shipment.carrierName || o.shipment.carrierCode}</p>
                      </>
                    ) : (
                      <span className="text-ink-400">Not shipped</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">
                    {o.sellers.length === 0
                      ? '—'
                      : o.sellers.length === 1
                        ? o.sellers[0].name
                        : `${o.sellers[0].name} +${o.sellers.length - 1}`}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">
                    <p>{o.user.name}</p>
                    <p className="text-ink-400">{o.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', ORDER_STATUS_STYLES[o.status])}>
                      {label(o.status)}
                    </span>
                    {o.disputes.length > 0 && <p className="mt-1 text-[10px] font-semibold text-amber-700">Disputed</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', SETTLEMENT_STYLES[o.settlementStatus])}>
                      {label(o.settlementStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/orders/${o.orderNumber}`} className="text-xs font-semibold text-brand-600 hover:underline">
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-ink-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Prev
          </button>
          <span className="text-xs text-ink-400">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-ink-600 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
