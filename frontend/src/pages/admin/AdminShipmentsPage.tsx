import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Clock, Package, Search, ShieldAlert, Truck, X } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField, TextAreaField } from '@/components/common/FormField'
import { LoadingOverlay } from '@/components/common/LoadingOverlay'
import {
  adminService,
  type AdminAuditLogEntry,
  type AdminDispute,
  type AdminDisputeStatus,
  type AdminRiskSignal,
  type AdminShipmentListItem,
  type AdminShipmentStatus,
} from '@/services/adminService'
import { getApiErrorMessage } from '@/services/api'
import { formatDateTimeLabel } from '@/utils/format'
import { cn } from '@/utils/cn'

type Tab = 'shipments' | 'disputes' | 'risk'

const SHIPMENT_STATUS_STYLES: Record<AdminShipmentStatus, string> = {
  AWB_SUBMITTED: 'bg-ink-100 text-ink-600',
  AWB_VERIFIED: 'bg-sky-50 text-sky-700',
  PICKUP_CONFIRMED: 'bg-gold-50 text-gold-700',
  IN_TRANSIT: 'bg-brand-50 text-brand-700',
  OUT_FOR_DELIVERY: 'bg-amber-100 text-amber-800',
  DELIVERED: 'bg-brand-100 text-brand-800',
  DELIVERY_FAILED: 'bg-danger-50 text-danger-600',
  RETURNED: 'bg-danger-50 text-danger-600',
  EXCEPTION: 'bg-danger-50 text-danger-600',
}

const DISPUTE_STATUS_STYLES: Record<AdminDisputeStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-800',
  UNDER_REVIEW: 'bg-sky-50 text-sky-700',
  RESOLVED: 'bg-brand-100 text-brand-800',
  REJECTED: 'bg-danger-50 text-danger-600',
}

export default function AdminShipmentsPage() {
  const [tab, setTab] = useState<Tab>('shipments')

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-1 flex items-center gap-2 text-xl">
        <Truck className="h-5 w-5 text-brand-600" aria-hidden="true" />
        Shipments &amp; Disputes
      </h1>
      <p className="mb-5 text-sm text-ink-500">
        Courier/tracking-provider data is the source of truth for pickup, transit, and delivery. You can flag a shipment for
        investigation and review buyer disputes here — courier-derived status and history can't be edited directly.
      </p>

      <div className="mb-5 flex max-w-md gap-1 rounded-full bg-surface-sunk p-1">
        <button
          type="button"
          onClick={() => setTab('shipments')}
          className={cn('flex-1 rounded-full py-2 text-xs font-semibold', tab === 'shipments' ? 'bg-surface shadow-card text-ink-900' : 'text-ink-500')}
        >
          Shipments
        </button>
        <button
          type="button"
          onClick={() => setTab('disputes')}
          className={cn('flex-1 rounded-full py-2 text-xs font-semibold', tab === 'disputes' ? 'bg-surface shadow-card text-ink-900' : 'text-ink-500')}
        >
          Disputes
        </button>
        <button
          type="button"
          onClick={() => setTab('risk')}
          className={cn('flex-1 rounded-full py-2 text-xs font-semibold', tab === 'risk' ? 'bg-surface shadow-card text-ink-900' : 'text-ink-500')}
        >
          Risk Signals
        </button>
      </div>

      {tab === 'shipments' && <ShipmentsTab />}
      {tab === 'disputes' && <DisputesTab />}
      {tab === 'risk' && <RiskSignalsTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shipments tab
// ---------------------------------------------------------------------------

function ShipmentsTab() {
  const [shipments, setShipments] = useState<AdminShipmentListItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminShipmentStatus | ''>('')
  const [flaggedOnly, setFlaggedOnly] = useState(false)
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null)

  const load = useCallback(async (query = '', status: AdminShipmentStatus | '' = '', flagged = false) => {
    setIsLoading(true)
    try {
      const { items, totalItems: total } = await adminService.listShipments({
        limit: 100,
        search: query || undefined,
        status: status || undefined,
        flagged: flagged || undefined,
      })
      setShipments(items)
      setTotalItems(total)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search, statusFilter, flaggedOnly), 300)
    return () => clearTimeout(t)
  }, [search, statusFilter, flaggedOnly, load])

  function handleFlagged(orderId: string) {
    load(search, statusFilter, flaggedOnly)
    setViewingOrderId(null)
    void orderId
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or AWB"
            className="h-10 w-full rounded-xl border border-ink-200 bg-surface pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AdminShipmentStatus | '')}
          className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-900 focus:border-brand-400"
        >
          <option value="">All statuses</option>
          {Object.keys(SHIPMENT_STATUS_STYLES).map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
          <input type="checkbox" checked={flaggedOnly} onChange={(e) => setFlaggedOnly(e.target.checked)} className="h-4 w-4 rounded border-ink-300" />
          Flagged only
        </label>
        <span className="text-xs text-ink-400">{totalItems} shipment{totalItems === 1 ? '' : 's'}</span>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : shipments.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-500">No shipments found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Buyer / Seller</th>
                <th className="px-4 py-3 font-medium">Courier / AWB</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last Event</th>
                <th className="px-4 py-3 font-medium">Last Sync</th>
                <th className="px-4 py-3 font-medium">Flags</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {shipments.map((s) => {
                const dispute = s.order.disputes.find((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW')
                const lastEvent = s.events[0]
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">#{s.order.orderNumber}</p>
                      {dispute && <span className="mt-0.5 inline-block rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">Disputed</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600">
                      <p>{s.order.user.name}</p>
                      {s.seller && <p className="text-ink-400">{s.seller.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium text-ink-800">{s.carrierName || s.carrierCode}</p>
                      <p className="text-ink-400">{s.awb}</p>
                      <p className="mt-0.5 flex items-center gap-1">
                        {s.verified ? (
                          <span className="flex items-center gap-1 text-brand-700"><CheckCircle2 className="h-3 w-3" aria-hidden="true" />verified</span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-700"><Clock className="h-3 w-3" aria-hidden="true" />unverified</span>
                        )}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', SHIPMENT_STATUS_STYLES[s.status])}>
                        {s.status.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      {s.pickupConfirmedAt && <p className="mt-1 text-[10px] text-ink-400">Picked up {formatDateTimeLabel(s.pickupConfirmedAt)}</p>}
                      {s.deliveredAt && <p className="text-[10px] text-ink-400">Delivered {formatDateTimeLabel(s.deliveredAt)}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-600">{lastEvent ? lastEvent.description : '—'}</td>
                    <td className="px-4 py-3 text-xs text-ink-500">{s.lastSyncedAt ? formatDateTimeLabel(s.lastSyncedAt) : 'Never'}</td>
                    <td className="px-4 py-3">
                      {s.flaggedForReview ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-danger-500">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          {s.riskFlags[0]?.replace(/_/g, ' ').toLowerCase() || 'Flagged'}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setViewingOrderId(s.order.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewingOrderId && <ShipmentDetailModal orderId={viewingOrderId} onClose={() => setViewingOrderId(null)} onFlagged={handleFlagged} />}
    </>
  )
}

function ShipmentDetailModal({ orderId, onClose, onFlagged }: { orderId: string; onClose: () => void; onFlagged: (orderId: string) => void }) {
  const [order, setOrder] = useState<any>(null)
  const [auditLog, setAuditLog] = useState<AdminAuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [note, setNote] = useState('')
  const [isFlagging, setIsFlagging] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminService
      .getShipmentDetail(orderId)
      .then(({ order: o, auditLog: log }) => {
        setOrder(o)
        setAuditLog(log)
      })
      .finally(() => setIsLoading(false))
  }, [orderId])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  async function submitFlag(e: FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setIsFlagging(true)
    setError('')
    try {
      await adminService.flagShipment(orderId, note.trim())
      onFlagged(orderId)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not flag this shipment.'))
    } finally {
      setIsFlagging(false)
    }
  }

  const shipment = order?.shipment

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <LoadingOverlay isLoading={isLoading} fullScreen={false} title="Loading…" message="Fetching shipment detail." />
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 text-ink-400 hover:text-ink-700">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {order && (
          <>
            <h2 className="text-base font-semibold text-ink-900">Order #{order.orderNumber}</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              {order.user?.name} · {order.items?.map((i: any) => i.product?.name || i.productName).join(', ')}
            </p>

            {shipment ? (
              <div className="mt-3 rounded-xl bg-surface-sunk p-3 text-xs text-ink-700">
                <p><span className="text-ink-500">Carrier:</span> <span className="font-semibold">{shipment.carrierName || shipment.carrierCode}</span></p>
                <p><span className="text-ink-500">AWB:</span> <span className="font-semibold">{shipment.awb}</span></p>
                <p><span className="text-ink-500">Status:</span> <span className="font-semibold">{shipment.status.replace(/_/g, ' ')}</span></p>
                <p><span className="text-ink-500">Verified:</span> {shipment.verified ? 'Yes' : 'No'}</p>
                {shipment.riskFlags?.length > 0 && (
                  <p className="mt-1 flex items-start gap-1 text-danger-500">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {shipment.riskFlags.join(', ').replace(/_/g, ' ').toLowerCase()}
                  </p>
                )}
                {shipment.riskNote && <p className="mt-1 whitespace-pre-line text-ink-500">Note: {shipment.riskNote}</p>}
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-400">No shipment submitted for this order yet.</p>
            )}

            {shipment?.events?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">Tracking Timeline</p>
                <ol className="space-y-2">
                  {shipment.events.map((e: any) => (
                    <li key={e.id} className="flex items-start gap-2 text-xs">
                      <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-ink-800">{e.description}</p>
                        <p className="text-ink-400">
                          {formatDateTimeLabel(e.eventTime)} · {e.location || 'Location unknown'} · via {e.source}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {auditLog.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">Audit Trail</p>
                <ol className="space-y-1.5">
                  {auditLog.map((a) => (
                    <li key={a.id} className="text-[11px] text-ink-500">
                      <span className="font-semibold text-ink-800">{a.action.replace(/_/g, ' ')}</span> · {a.source.toLowerCase()} · {formatDateTimeLabel(a.createdAt)}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {shipment && (
              <div className="mt-5 border-t border-ink-100 pt-4">
                {!showFlagForm ? (
                  <Button variant="secondary" className="h-9 px-4 text-xs" onClick={() => setShowFlagForm(true)}>
                    Flag for investigation
                  </Button>
                ) : (
                  <form onSubmit={submitFlag}>
                    <TextAreaField
                      id="flag-note"
                      label="Why is this shipment being flagged?"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      required
                    />
                    {error && <p className="mb-2 text-xs font-medium text-danger-500">{error}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" className="h-9 px-4 text-xs" loading={isFlagging} disabled={!note.trim()}>
                        Submit flag
                      </Button>
                      <Button type="button" variant="ghost" className="h-9 px-3 text-xs" onClick={() => setShowFlagForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// Disputes tab
// ---------------------------------------------------------------------------

function DisputesTab() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<AdminDisputeStatus | ''>('')
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const load = useCallback(async (status: AdminDisputeStatus | '' = '') => {
    setIsLoading(true)
    try {
      const { items, totalItems: total } = await adminService.listDisputes({ limit: 100, status: status || undefined })
      setDisputes(items)
      setTotalItems(total)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load(statusFilter)
  }, [statusFilter, load])

  function handleReviewed(updated: AdminDispute) {
    setDisputes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
    setReviewingId(null)
  }

  const reviewing = disputes.find((d) => d.id === reviewingId)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AdminDisputeStatus | '')}
          className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-900 focus:border-brand-400"
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <span className="text-xs text-ink-400">{totalItems} dispute{totalItems === 1 ? '' : 's'}</span>
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
      ) : disputes.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-500">No disputes found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Filed</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {disputes.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3 font-medium text-ink-900">#{d.order.orderNumber}</td>
                  <td className="px-4 py-3 text-xs text-ink-600">
                    <p>{d.user.name}</p>
                    <p className="text-ink-400">{d.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">
                    <p>{d.reason}</p>
                    {d.details && <p className="mt-0.5 text-ink-400">{d.details}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">{formatDateTimeLabel(d.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', DISPUTE_STATUS_STYLES[d.status])}>
                      {d.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(d.status === 'OPEN' || d.status === 'UNDER_REVIEW') && (
                      <Button variant="secondary" className="h-8 px-3 text-xs" onClick={() => setReviewingId(d.id)}>
                        Review
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reviewing && <DisputeReviewModal dispute={reviewing} onClose={() => setReviewingId(null)} onReviewed={handleReviewed} />}
    </>
  )
}

function DisputeReviewModal({ dispute, onClose, onReviewed }: { dispute: AdminDispute; onClose: () => void; onReviewed: (updated: AdminDispute) => void }) {
  const [status, setStatus] = useState<'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED'>(dispute.status === 'OPEN' ? 'UNDER_REVIEW' : 'RESOLVED')
  const [adminNote, setAdminNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const updated = await adminService.reviewDispute(dispute.id, status, adminNote.trim() || undefined)
      onReviewed(updated)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update this dispute.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 text-ink-400 hover:text-ink-700">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <h2 className="text-base font-semibold text-ink-900">Review Dispute — Order #{dispute.order.orderNumber}</h2>
        <p className="mt-1 text-xs text-ink-500">Buyer reported: "{dispute.reason}"{dispute.details ? ` — ${dispute.details}` : ''}</p>

        <form className="mt-4" onSubmit={handleSubmit}>
          <SelectField id="dispute-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="UNDER_REVIEW">Mark under review</option>
            <option value="RESOLVED">Resolve (upheld in buyer's favor)</option>
            <option value="REJECTED">Reject (delivery evidence stands)</option>
          </SelectField>
          <TextAreaField
            id="dispute-note"
            label="Admin note"
            hint="Optional — record what action was taken (refund, replacement, etc.)"
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            rows={3}
          />
          {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
          <div className="mt-2 flex gap-2">
            <Button type="submit" fullWidth loading={isSubmitting}>
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// Risk signals tab
// ---------------------------------------------------------------------------

function RiskSignalsTab() {
  const [signals, setSignals] = useState<AdminRiskSignal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    adminService
      .listRiskSignals()
      .then(setSignals)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <p className="py-10 text-center text-sm text-ink-400">Loading…</p>
  if (signals.length === 0) return <p className="py-10 text-center text-sm text-ink-500">No risk signals raised recently.</p>

  return (
    <div className="space-y-2">
      {signals.map((s) => (
        <div key={s.id} className="flex items-start gap-3 rounded-2xl border border-ink-100 bg-surface p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-ink-900">{s.metadata?.reason?.replace(/_/g, ' ').toLowerCase() || 'Risk signal'}</p>
            <p className="text-xs text-ink-500">
              {s.actor ? `${s.actor.name} (${s.actor.email})` : 'Unknown seller'}
              {s.metadata?.count ? ` · ${s.metadata.count} occurrences in the last ${s.metadata.windowDays ?? '?'} days` : ''}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-400">{formatDateTimeLabel(s.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
