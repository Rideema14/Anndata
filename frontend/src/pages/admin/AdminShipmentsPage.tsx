import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Package,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react'
import {
  adminService,
  type AdminOrderDetail,
  type AdminOrderListItem,
  type AdminOrderStatus,
} from '@/services/adminService'
import { getApiErrorMessage } from '@/services/api'
import { formatDateTimeLabel } from '@/utils/format'
import { cn } from '@/utils/cn'

const PAGE_SIZE = 20

const SHIPMENT_STATUSES: AdminOrderStatus[] = [
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'RETURNED',
  'DISPUTED',
]

const STATUS_STYLES: Record<AdminOrderStatus, string> = {
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

function label(value: string): string {
  return value.replace(/_/g, ' ').toLowerCase()
}

/**
 * Shipment administration now follows the current Anndata architecture:
 * sellers submit courier + AWB once, while admins verify delivery through
 * the courier's official tracking page and manually advance the order status.
 * The old automatic-tracking/risk-signal API has intentionally been removed.
 */
export default function AdminShipmentsPage() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<AdminOrderStatus | ''>('')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<AdminOrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const result = await adminService.listAllOrders({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        status: status || undefined,
      })
      // The backend intentionally lists orders rather than maintaining a
      // second shipment table/query. Keep only orders that currently have a
      // shipment attached.
      setOrders(result.items.filter((order) => Boolean(order.shipment)))
      setTotalItems(result.totalItems)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load shipments.'))
    } finally {
      setIsLoading(false)
    }
  }, [page, search, status])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300)
    return () => window.clearTimeout(timer)
  }, [load])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  const selectedShipment = useMemo(() => selected?.order.shipment ?? null, [selected])

  async function openDetail(orderId: string) {
    setDetailLoading(true)
    setError('')
    try {
      const detail = await adminService.getOrderDetail(orderId)
      setSelected(detail)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load shipment details.'))
    } finally {
      setDetailLoading(false)
    }
  }

  async function updateStatus(nextStatus: AdminOrderStatus) {
    if (!selected) return
    try {
      await adminService.updateOrderStatus(selected.order.id, nextStatus)
      await openDetail(selected.order.id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update shipment status.'))
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-ink-900">
            <Truck className="h-5 w-5 text-brand-600" aria-hidden="true" />
            Shipment Management
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-ink-500">
            Review seller-submitted courier and AWB information. Use the official courier tracking page to verify delivery, then update the order status manually.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-surface px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Order #, AWB, seller, or buyer"
            autoComplete="off"
            className="h-10 w-full rounded-xl border border-ink-200 bg-surface pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as AdminOrderStatus | '')
            setPage(1)
          }}
          className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-xs text-ink-700 focus:border-brand-400"
        >
          <option value="">All shipment statuses</option>
          {SHIPMENT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {label(item)}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-ink-400">
          {totalItems} order{totalItems === 1 ? '' : 's'} in the current filter
        </span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-ink-400">Loading shipments…</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-ink-100 bg-surface px-6 py-12 text-center">
          <Package className="mx-auto h-8 w-8 text-ink-300" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-ink-700">No shipments found.</p>
          <p className="mt-1 text-xs text-ink-400">Try a different search or status filter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Courier / AWB</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.map((order) => (
                <tr key={order.id} className={order.disputes.length ? 'bg-amber-50/40' : undefined}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">#{order.orderNumber}</p>
                    <p className="text-xs text-ink-500">{formatDateTimeLabel(order.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {order.shipment ? (
                      <>
                        <p className="font-medium text-ink-800">{order.shipment.awb}</p>
                        <p className="text-xs text-ink-500">{order.shipment.carrierName || order.shipment.carrierCode}</p>
                      </>
                    ) : (
                      <span className="text-xs text-ink-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">
                    {order.sellers.length === 0
                      ? '—'
                      : order.sellers.length === 1
                        ? order.sellers[0].name
                        : `${order.sellers[0].name} +${order.sellers.length - 1}`}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">
                    <p>{order.user.name}</p>
                    <p className="text-ink-400">{order.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', STATUS_STYLES[order.status])}>
                      {label(order.status)}
                    </span>
                    {order.disputes.length > 0 && <p className="mt-1 text-[10px] font-semibold text-amber-700">Disputed</p>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void openDetail(order.id)}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Review
                    </button>
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
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-ink-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Prev
          </button>
          <span className="text-xs text-ink-400">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-ink-600 disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {(selected || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 md:items-center md:p-6" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-xl md:rounded-3xl">
            {detailLoading ? (
              <div className="py-12 text-center text-sm text-ink-400">Loading shipment details…</div>
            ) : selected ? (
              <>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Shipment review</p>
                    <h2 className="mt-1 text-lg font-bold text-ink-900">Order #{selected.order.orderNumber}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-lg px-2 py-1 text-sm text-ink-500 hover:bg-ink-50"
                  >
                    Close
                  </button>
                </div>

                {selectedShipment ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-ink-100 p-4">
                      <p className="text-xs text-ink-400">Courier</p>
                      <p className="mt-1 text-sm font-semibold text-ink-900">
                        {selectedShipment.carrierName || selectedShipment.carrierCode}
                      </p>
                    </div>
                    <div className="rounded-xl border border-ink-100 p-4">
                      <p className="text-xs text-ink-400">AWB / Tracking number</p>
                      <p className="mt-1 break-all text-sm font-semibold text-ink-900">{selectedShipment.awb}</p>
                    </div>
                    <div className="rounded-xl border border-ink-100 p-4">
                      <p className="text-xs text-ink-400">Submitted</p>
                      <p className="mt-1 text-sm text-ink-800">{formatDateTimeLabel(selectedShipment.submittedAt)}</p>
                    </div>
                    <div className="rounded-xl border border-ink-100 p-4">
                      <p className="text-xs text-ink-400">Current order status</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-ink-900">{label(selected.order.status)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl bg-ink-50 p-4 text-sm text-ink-600">No shipment is attached to this order.</p>
                )}

                {selectedShipment?.trackingUrl && (
                  <a
                    href={selectedShipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Open official tracking page
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}

                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Manual status update</p>
                  <div className="flex flex-wrap gap-2">
                    {SHIPMENT_STATUSES.filter((item) => item !== selected.order.status).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => void updateStatus(item)}
                        className="rounded-xl border border-ink-200 px-3 py-2 text-xs font-semibold capitalize text-ink-700 hover:border-brand-300 hover:text-brand-700"
                      >
                        Mark {label(item)}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-[11px] text-ink-400">
                    The backend remains the source of truth and will reject invalid status transitions.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <Link
                    to={`/admin/orders/${selected.order.orderNumber}`}
                    onClick={() => setSelected(null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Open full order management
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
