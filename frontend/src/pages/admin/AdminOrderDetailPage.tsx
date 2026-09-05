import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronLeft,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldAlert,
  Truck,
  User as UserIcon,
  Wallet,
  X,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { SelectField, TextAreaField, TextField } from '@/components/common/FormField'
import { LoadingOverlay } from '@/components/common/LoadingOverlay'
import {
  adminService,
  type AdminOrderDetail,
  type AdminOrderStatus,
} from '@/services/adminService'
import { getApiErrorMessage } from '@/services/api'
import { formatDateTimeLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

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

/** Admin can move an order to any of these via the manual override — the backend enforces the real transition graph and rejects anything invalid, this is just "don't offer the obviously-wrong ones". */
const NEXT_STATUS_OPTIONS: Record<AdminOrderStatus, AdminOrderStatus[]> = {
  PENDING: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'SHIPPED', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'DELIVERY_FAILED', 'RETURNED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELIVERY_FAILED', 'RETURNED'],
  DELIVERY_FAILED: ['OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  DISPUTED: [],
  CANCELLED: [],
  RETURNED: [],
}

function label(value: string): string {
  return value.replace(/_/g, ' ').toLowerCase()
}

function copyToClipboard(value: string) {
  navigator.clipboard?.writeText(value).catch(() => {})
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')

  const [statusNote, setStatusNote] = useState('')
  const [nextStatus, setNextStatus] = useState<AdminOrderStatus | ''>('')
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const [showSettleModal, setShowSettleModal] = useState(false)
  const [showCorrectModal, setShowCorrectModal] = useState(false)
  const [confirmingRefund, setConfirmingRefund] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setLoadError('')
    try {
      const data = await adminService.getOrderDetail(id)
      setDetail(data)
      setNextStatus('')
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not load this order.'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleStatusChange() {
    if (!id || !nextStatus) return
    setIsChangingStatus(true)
    setActionError('')
    try {
      await adminService.updateOrderStatus(id, nextStatus, statusNote.trim() || undefined)
      setStatusNote('')
      await load()
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not change order status.'))
    } finally {
      setIsChangingStatus(false)
    }
  }

  async function handleConfirmRefund() {
    if (!id) return
    setConfirmingRefund(true)
    setActionError('')
    try {
      await adminService.confirmBuyerRefund(id, {})
      await load()
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not mark this refund as issued.'))
    } finally {
      setConfirmingRefund(false)
    }
  }

  if (isLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-400">Loading order…</div>
  }
  if (loadError || !detail) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-danger-500">{loadError || 'Order not found.'}</p>
        <Link to="/admin/orders" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to All Orders
        </Link>
      </div>
    )
  }

  const { order, settlementHistory, auditLog } = detail
  const openDispute = order.disputes.find((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW')
  const distinctSellers = [...new Map(order.items.filter((i) => i.product?.seller).map((i) => [i.product!.seller!.id, i.product!.seller!])).values()]
  const nextOptions = NEXT_STATUS_OPTIONS[order.status] ?? []

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 md:px-6 md:py-8">
      <Link to="/admin/orders" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All Orders
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Order #{order.orderNumber}</h1>
          <p className="mt-0.5 text-xs text-ink-500">Placed {formatDateTimeLabel(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold capitalize', ORDER_STATUS_STYLES[order.status])}>{label(order.status)}</span>
          <span className={cn('rounded-full px-3 py-1 text-xs font-semibold capitalize', SETTLEMENT_STYLES[order.settlementStatus])}>
            {label(order.settlementStatus)}
          </span>
        </div>
      </div>

      {openDispute && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-amber-900">Open delivery dispute</p>
            <p className="mt-0.5 text-amber-800">"{openDispute.reason}"{openDispute.details ? ` — ${openDispute.details}` : ''}</p>
            <p className="mt-1 text-xs text-amber-700">Review this from the Disputes queue to close it out.</p>
          </div>
        </div>
      )}

      {actionError && <p className="mb-4 text-sm font-medium text-danger-500">{actionError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Buyer */}
        <section className="rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
            <UserIcon className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Buyer
          </h2>
          <p className="text-sm font-medium text-ink-900">{order.user.name}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-600">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <a href={`mailto:${order.user.email}`} className="hover:underline">{order.user.email}</a>
          </p>
          {order.user.phone && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-600">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <a href={`tel:${order.user.phone}`} className="hover:underline">{order.user.phone}</a>
              <button type="button" onClick={() => copyToClipboard(order.user.phone!)} className="text-ink-400 hover:text-ink-700">
                <Copy className="h-3 w-3" aria-hidden="true" />
              </button>
            </p>
          )}
          <div className="mt-2 flex items-start gap-1.5 text-xs text-ink-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {order.address.fullName}, {order.address.phone}
              <br />
              {order.address.addressLine1}
              {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}, {order.address.city}, {order.address.state} – {order.address.postalCode}
            </span>
          </div>
        </section>

        {/* Seller(s) */}
        <section className="rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
            <Package className="h-4 w-4 text-brand-600" aria-hidden="true" />
            Seller{distinctSellers.length === 1 ? '' : 's'}
          </h2>
          {distinctSellers.length === 0 ? (
            <p className="text-xs text-ink-400">No seller info.</p>
          ) : (
            <div className="space-y-2">
              {distinctSellers.map((s) => (
                <div key={s.id} className="text-xs text-ink-600">
                  <p className="text-sm font-medium text-ink-900">{s.name}</p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <a href={`mailto:${s.email}`} className="hover:underline">{s.email}</a>
                  </p>
                  {s.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <a href={`tel:${s.phone}`} className="hover:underline">{s.phone}</a>
                      <button type="button" onClick={() => copyToClipboard(s.phone!)} className="text-ink-400 hover:text-ink-700">
                        <Copy className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Items */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink-900">Order Items</h2>
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-sunk text-ink-400">
                {item.product?.images?.[0]?.url ? (
                  <img src={item.product.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-ink-900">{item.productName}</p>
                <p className="text-xs text-ink-400">
                  {formatINR(Number(item.unitPrice))} × {item.quantity} {item.product?.seller ? `· ${item.product.seller.name}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-900">{formatINR(Number(item.totalPrice))}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Payment breakdown */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Wallet className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Payment
        </h2>
        <div className="space-y-1 text-xs text-ink-600">
          <div className="flex justify-between"><span>Product Amount</span><span>{formatINR(Number(order.subtotal))}</span></div>
          <div className="flex justify-between"><span>Platform Charges</span><span>{formatINR(Number(order.shippingFee))}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{formatINR(Number(order.tax))}</span></div>
          <div className="flex justify-between border-t border-ink-100 pt-1.5 text-sm font-bold text-ink-900">
            <span>Total Buyer Paid</span><span>{formatINR(Number(order.totalAmount))}</span>
          </div>
        </div>
        {order.payment && (
          <p className="mt-2 text-xs text-ink-500">
            Status: <span className="font-semibold capitalize text-ink-800">{order.payment.status.toLowerCase()}</span>
            {order.payment.method ? ` · ${order.payment.method}` : ''}
          </p>
        )}
      </section>

      {/* Shipment */}
      <section className="mt-4 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Truck className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Shipment
        </h2>
        {order.shipment ? (
          <div className="text-xs text-ink-600">
            <p><span className="text-ink-500">Courier: </span><span className="font-semibold text-ink-900">{order.shipment.carrierName || order.shipment.carrierCode}</span></p>
            <p className="mt-1 flex items-center gap-1.5">
              <span className="text-ink-500">AWB: </span>
              <span className="font-semibold text-ink-900">{order.shipment.awb}</span>
              <button type="button" onClick={() => copyToClipboard(order.shipment!.awb)} className="text-ink-400 hover:text-ink-700">
                <Copy className="h-3 w-3" aria-hidden="true" />
              </button>
            </p>
            {order.shipment.shipmentDate && <p className="mt-1"><span className="text-ink-500">Shipped: </span>{formatDateTimeLabel(order.shipment.shipmentDate)}</p>}
            {order.shipment.note && <p className="mt-1 text-ink-500">Note: {order.shipment.note}</p>}
            <p className="mt-1 text-ink-500">Submitted {formatDateTimeLabel(order.shipment.submittedAt)}{order.shipment.seller ? ` by ${order.shipment.seller.name}` : ''}</p>
            {order.shipment.trackingUrl && (
              <a
                href={order.shipment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
              >
                Open Official Courier Tracking <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>This is what the seller submitted — it is not confirmation of delivery. Verify manually on the courier's site before marking delivered.</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-400">Not shipped yet.</p>
        )}
      </section>

      {/* Status management */}
      {nextOptions.length > 0 && (
        <section className="mt-4 rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold text-ink-900">Update Order Status</h2>
          <div className="flex flex-wrap items-end gap-2">
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value as AdminOrderStatus | '')}
              className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-xs text-ink-700 focus:border-brand-400"
            >
              <option value="">Select new status…</option>
              {nextOptions.map((s) => (
                <option key={s} value={s}>{label(s)}</option>
              ))}
            </select>
            <input
              type="text"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              placeholder="Note (optional)"
              className="h-10 flex-1 min-w-[10rem] rounded-xl border border-ink-200 bg-surface px-3 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-400"
            />
            <Button className="h-10 px-4 text-xs" disabled={!nextStatus} loading={isChangingStatus} onClick={handleStatusChange}>
              Apply
            </Button>
          </div>
        </section>
      )}

      {/* Settlement */}
      <section className="mt-4 rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-4">
        <h2 className="mb-3 text-sm font-bold text-ink-900">Settlement</h2>

        {order.settlementStatus === 'NOT_ELIGIBLE' && <p className="text-xs text-ink-500">Nothing to settle yet.</p>}

        {order.settlementStatus === 'PENDING_REVIEW' && (
          <>
            <p className="mb-3 text-xs text-ink-600">This order needs a settlement decision — refund the buyer in full, or approve the seller's payout.</p>
            <Button className="h-10 px-4 text-xs" onClick={() => setShowSettleModal(true)}>
              Decide Settlement
            </Button>
          </>
        )}

        {order.settlementStatus === 'BUYER_REFUND_PENDING' && (
          <>
            <p className="mb-3 text-xs text-ink-600">A refund of {formatINR(Number(settlementHistory[0]?.amount ?? 0))} was approved. Confirm once it's actually been issued.</p>
            <Button className="h-10 px-4 text-xs" loading={confirmingRefund} onClick={handleConfirmRefund}>
              Mark Refund as Issued
            </Button>
          </>
        )}

        {(order.settlementStatus === 'SELLER_PAYOUT_PENDING' || order.settlementStatus === 'SELLER_PAID' || order.settlementStatus === 'BUYER_REFUNDED') && (
          <>
            <p className="mb-3 text-xs text-ink-600">
              {order.settlementStatus === 'SELLER_PAYOUT_PENDING' && 'Seller payout approved — pays out from the seller\'s balance on the Payouts page.'}
              {order.settlementStatus === 'SELLER_PAID' && 'Seller has been paid for this order.'}
              {order.settlementStatus === 'BUYER_REFUNDED' && 'Buyer has been refunded for this order.'}
            </p>
            <button type="button" onClick={() => setShowCorrectModal(true)} className="text-xs font-semibold text-danger-500 hover:underline">
              This is wrong — reopen for review
            </button>
          </>
        )}

        {settlementHistory.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-brand-200/60 pt-3">
            {settlementHistory.map((s) => (
              <div key={s.id} className="text-[11px] text-ink-500">
                <span className="font-semibold text-ink-800">{label(s.status)}</span>
                {s.decision && <span> · {label(s.decision)}</span>}
                {Number(s.amount) > 0 && <span> · {formatINR(Number(s.amount))}</span>}
                {s.seller && <span> · {s.seller.name}</span>}
                <span> · {formatDateTimeLabel(s.createdAt)}</span>
                {s.reason && <p className="mt-0.5 text-ink-400">{s.reason}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Audit trail */}
      {auditLog.length > 0 && (
        <section className="mt-4 rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold text-ink-900">Audit Trail</h2>
          <ol className="space-y-2">
            {auditLog.map((a) => (
              <li key={a.id} className="text-[11px] text-ink-500">
                <span className="font-semibold text-ink-800">{label(a.action)}</span>
                {a.previousState && a.newState ? ` · ${label(a.previousState)} → ${label(a.newState)}` : ''}
                <span className="ml-1">· {formatDateTimeLabel(a.createdAt)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {showSettleModal && (
        <SettleModal
          order={order}
          sellers={distinctSellers}
          onClose={() => setShowSettleModal(false)}
          onDecided={() => {
            setShowSettleModal(false)
            load()
          }}
        />
      )}
      {showCorrectModal && (
        <CorrectModal
          orderNumber={order.orderNumber}
          onClose={() => setShowCorrectModal(false)}
          onCorrected={() => {
            setShowCorrectModal(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function SettleModal({
  order,
  sellers,
  onClose,
  onDecided,
}: {
  order: AdminOrderDetail['order']
  sellers: { id: string; name: string; email: string }[]
  onClose: () => void
  onDecided: () => void
}) {
  const [decision, setDecision] = useState<'REFUND_BUYER' | 'PAY_SELLER'>('REFUND_BUYER')
  const [sellerId, setSellerId] = useState(sellers[0]?.id ?? '')
  const [reason, setReason] = useState('')
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const platformAmount = Number(order.shippingFee) + Number(order.tax)
  const amount = decision === 'REFUND_BUYER' ? Number(order.totalAmount) : Number(order.subtotal)

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

  function goToConfirm(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (reason.trim().length < 10) {
      setError('Explain the reason for this settlement decision (at least 10 characters).')
      return
    }
    if (decision === 'PAY_SELLER' && sellers.length > 1 && !sellerId) {
      setError('Select which seller to pay out.')
      return
    }
    setStep('confirm')
  }

  async function handleConfirm() {
    setIsSubmitting(true)
    setError('')
    try {
      await adminService.decideSettlement(order.orderNumber, {
        decision,
        sellerId: decision === 'PAY_SELLER' && sellers.length > 1 ? sellerId : undefined,
        reason: reason.trim(),
      })
      onDecided()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not record this settlement decision.'))
      setStep('form')
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <LoadingOverlay isLoading={isSubmitting} fullScreen={false} title="Recording settlement…" message="Saving this decision." />
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 text-ink-400 hover:text-ink-700">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {step === 'form' ? (
          <form onSubmit={goToConfirm}>
            <h2 className="text-base font-semibold text-ink-900">Settle Order #{order.orderNumber}</h2>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setDecision('REFUND_BUYER')}
                className={cn('flex-1 rounded-xl border-2 p-3 text-left text-xs', decision === 'REFUND_BUYER' ? 'border-brand-500 bg-brand-50' : 'border-ink-200')}
              >
                <p className="font-semibold text-ink-900">Refund Buyer</p>
                <p className="mt-0.5 text-ink-500">Full amount paid: {formatINR(Number(order.totalAmount))}</p>
              </button>
              <button
                type="button"
                onClick={() => setDecision('PAY_SELLER')}
                className={cn('flex-1 rounded-xl border-2 p-3 text-left text-xs', decision === 'PAY_SELLER' ? 'border-brand-500 bg-brand-50' : 'border-ink-200')}
              >
                <p className="font-semibold text-ink-900">Pay Seller</p>
                <p className="mt-0.5 text-ink-500">Product amount: {formatINR(Number(order.subtotal))}</p>
              </button>
            </div>

            {decision === 'PAY_SELLER' && sellers.length > 1 && (
              <SelectField id="settle-seller" label="Seller" value={sellerId} onChange={(e) => setSellerId(e.target.value)} required>
                <option value="">Select seller…</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </SelectField>
            )}

            <TextAreaField
              id="settle-reason"
              label="Reason"
              hint="Required — explain why you're making this settlement decision."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />

            {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}

            <div className="mt-2 flex gap-2">
              <Button type="submit" fullWidth>Review Decision</Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div>
            <h2 className="text-base font-semibold text-ink-900">Confirm Settlement</h2>
            <p className="mt-1 text-xs text-ink-500">You are about to settle order #{order.orderNumber}. This action will be recorded.</p>
            <div className="mt-3 rounded-xl bg-surface-sunk p-3 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Decision</span><span className="font-semibold text-ink-900">{decision === 'REFUND_BUYER' ? 'Refund Buyer' : 'Pay Seller'}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Amount</span><span className="font-semibold text-ink-900">{formatINR(amount)}</span></div>
              {decision === 'PAY_SELLER' && (
                <div className="flex justify-between"><span className="text-ink-500">Platform retains</span><span className="font-semibold text-ink-900">{formatINR(platformAmount)}</span></div>
              )}
            </div>
            {error && <p className="mt-3 text-xs font-medium text-danger-500">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button fullWidth loading={isSubmitting} onClick={handleConfirm}>
                {decision === 'REFUND_BUYER' ? 'Confirm Refund' : 'Confirm Payout'}
              </Button>
              <Button variant="secondary" onClick={() => setStep('form')} disabled={isSubmitting}>Back</Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function CorrectModal({ orderNumber, onClose, onCorrected }: { orderNumber: string; onClose: () => void; onCorrected: () => void }) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (reason.trim().length < 10) {
      setError('Explain the reason for this correction (at least 10 characters).')
      return
    }
    setIsSubmitting(true)
    try {
      await adminService.correctSettlement(orderNumber, { reason: reason.trim() })
      onCorrected()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reopen this settlement.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <LoadingOverlay isLoading={isSubmitting} fullScreen={false} title="Reopening settlement…" message="Saving this correction." />
        <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 text-ink-400 hover:text-ink-700">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <h2 className="text-base font-semibold text-ink-900">Reopen Settlement</h2>
        <p className="mt-1 text-xs text-ink-500">This puts order #{orderNumber} back into review — the original decision stays in the audit trail, this adds a correction record.</p>
        <form className="mt-3" onSubmit={handleSubmit}>
          <TextField id="correct-reason" label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} required />
          {error && <p className="mb-3 text-xs font-medium text-danger-500">{error}</p>}
          <div className="mt-2 flex gap-2">
            <Button type="submit" fullWidth loading={isSubmitting}>Reopen for Review</Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
