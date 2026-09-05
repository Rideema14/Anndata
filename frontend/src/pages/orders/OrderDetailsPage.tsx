import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, ExternalLink, MapPin, Truck, Wallet } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { STATUS_SEQUENCE, useOrders } from '@/context/OrderContext'
import { orderService } from '@/services/orderService'
import { getApiErrorMessage } from '@/services/api'
import type { Order } from '@/types'
import { useLanguage, type TranslationKey } from '@/context/LanguageContext'
import { formatINR, formatDateLabel } from '@/utils/format'
import { cn } from '@/utils/cn'

const STAGE_KEYS: Record<string, TranslationKey> = {
  placed: 'orders.statusPlaced',
  confirmed: 'orders.statusConfirmed',
  packed: 'orders.statusPacked',
  shipped: 'orders.statusShipped',
  out_for_delivery: 'orders.statusOutForDelivery',
  delivered: 'orders.statusDelivered',
}
const ORDER_STATUS_KEYS: Record<string, TranslationKey> = {
  ...STAGE_KEYS,
  disputed: 'orders.statusDisputed',
  cancelled: 'orders.statusCancelled',
  returned: 'orders.statusReturned',
  delivery_failed: 'orders.statusDeliveryFailed',
}

/** Off-the-happy-path statuses shown as a plain message instead of the stepper — every one of these needs (or already got) an admin decision, not a customer-visible progress bar. */
const OFF_PATH_STATUSES = ['cancelled', 'returned', 'delivery_failed']

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { refresh: refreshOrders } = useOrders()
  const { t } = useLanguage()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeDetails, setDisputeDetails] = useState('')
  const [disputeSubmitting, setDisputeSubmitting] = useState(false)
  const [disputeError, setDisputeError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function loadOrder() {
      try {
        const fetchedOrder = await orderService.getOne(id!)
        if (!cancelled) setOrder(fetchedOrder)
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load order details.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadOrder()

    // Light periodic refresh so an admin's manual status update (e.g. marking
    // delivered, or a settlement decision) shows up without a manual reload —
    // there's no live courier feed anymore, just occasional admin actions.
    const interval = setInterval(() => {
      if (order && !OFF_PATH_STATUSES.includes(order.status) && order.status !== 'delivered') {
        loadOrder()
      }
    }, 15000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [id, order?.status])

  async function handleCancel() {
    if (!id) return
    setCancelling(true)
    setError('')
    try {
      const updated = await orderService.cancel(id)
      setOrder(updated)
      await refreshOrders()
    } catch (err) {
      setError(getApiErrorMessage(err, t('orders.couldNotCancel')))
    } finally {
      setCancelling(false)
    }
  }

  async function handleReportProblem() {
    if (!id || !disputeReason.trim()) return
    setDisputeSubmitting(true)
    setDisputeError('')
    try {
      const dispute = await orderService.createDispute(id, disputeReason.trim(), disputeDetails.trim() || undefined)
      setOrder((prev) => (prev ? { ...prev, status: 'disputed', disputes: [dispute, ...(prev.disputes ?? [])] } : prev))
      setShowDisputeForm(false)
      setDisputeReason('')
      setDisputeDetails('')
    } catch (err) {
      setDisputeError(getApiErrorMessage(err, 'Could not submit your report. Please try again.'))
    } finally {
      setDisputeSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-400">{t('common.loading')}</div>
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">{t('orders.orderNotFound')}</p>
        <Link to="/orders" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          {t('orders.backToOrders')}
        </Link>
      </div>
    )
  }

  const isOffPath = OFF_PATH_STATUSES.includes(order.status)
  // A dispute can only ever be opened on an order already marked delivered —
  // treat it as "delivered" for the stepper so the buyer still sees their
  // full delivery journey, with the dispute called out separately below
  // rather than resetting the progress bar.
  const currentIndex = STATUS_SEQUENCE.indexOf(order.status === 'disputed' ? 'delivered' : order.status)
  const canCancel = order.status === 'placed'
  const openDispute = order.disputes?.find((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW')
  const canReportProblem = order.status === 'delivered' && !openDispute
  const carrierName = order.shipment?.carrierName || order.shipment?.carrierCode

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <Link to="/orders" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t('orders.allOrders')}
      </Link>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink-900">#{order.id}</h1>
          <p className="text-xs text-ink-400">{t('orders.placed')} {formatDateLabel(order.placedAt)}</p>
        </div>
        <p className="text-lg font-bold text-ink-900">{formatINR(order.total)}</p>
      </div>

      {/* Refund status — only shown once a settlement decision has actually been made in the buyer's favor */}
      {(order.settlementStatus === 'buyer_refund_pending' || order.settlementStatus === 'buyer_refunded') && (
        <section
          className={cn(
            'mb-5 flex items-start gap-3 rounded-2xl border-2 p-4',
            order.settlementStatus === 'buyer_refunded' ? 'border-brand-200 bg-brand-50' : 'border-sky-200 bg-sky-50',
          )}
        >
          {order.settlementStatus === 'buyer_refunded' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
          ) : (
            <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1 text-sm">
            <p className={cn('font-semibold', order.settlementStatus === 'buyer_refunded' ? 'text-brand-900' : 'text-sky-900')}>
              {order.settlementStatus === 'buyer_refunded' ? 'Refund issued' : 'Refund approved'}
            </p>
            <p className={cn('mt-0.5', order.settlementStatus === 'buyer_refunded' ? 'text-brand-800' : 'text-sky-800')}>
              {order.settlementStatus === 'buyer_refunded'
                ? `A full refund of ${formatINR(order.total)} for this order has been issued.`
                : `A full refund of ${formatINR(order.total)} has been approved for this order and will be processed shortly.`}
            </p>
          </div>
        </section>
      )}

      {/* Shipping / tracking */}
      {order.shipment && (
        <section className="mb-5 rounded-2xl border-2 border-brand-200 bg-brand-50/70 p-5" aria-label="Shipment details">
          <div className="flex items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <Truck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Delivery Information</p>
              <p className="mt-1 text-sm font-semibold text-ink-900">{carrierName}</p>
              <p className="mt-0.5 break-all text-xl font-extrabold tracking-wide text-brand-900">{order.shipment.awb}</p>

              {order.shipment.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
                >
                  {order.shipment.trackingUrlIsDirect ? `Track on ${carrierName}` : 'Open Official Tracking Page'} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
              {order.shipment.trackingUrl && !order.shipment.trackingUrlIsDirect && (
                <p className="mt-1 text-[11px] text-ink-500">Enter AWB {order.shipment.awb} on that page to check status.</p>
              )}
              <p className="mt-3 text-[11px] text-ink-500">
                Delivery is confirmed by our team once verified with the courier — this page will update automatically.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Main Stepper Tracker */}
      <div className="mb-6 rounded-2xl border border-ink-100 bg-surface p-4">
        {isOffPath ? (
          <p className={cn('text-sm font-semibold', order.status === 'cancelled' ? 'text-danger-500' : 'text-ink-500')}>
            {t('orders.orderWas')} {t(ORDER_STATUS_KEYS[order.status]).toLowerCase()}.
          </p>
        ) : (
          <ol>
            {STATUS_SEQUENCE.map((stage, index) => {
              const done = index <= currentIndex
              const isLast = index === STATUS_SEQUENCE.length - 1
              return (
                <li key={stage} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                        done ? 'bg-brand-600 text-white' : 'bg-surface-sunk text-ink-400',
                      )}
                    >
                      {done ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}
                    </span>
                    {!isLast && <span className={cn('w-0.5 flex-1', index < currentIndex ? 'bg-brand-600' : 'bg-surface-sunk')} style={{ minHeight: 28 }} />}
                  </div>
                  <div className={cn('pb-6 text-sm', done ? 'text-ink-900' : 'text-ink-400')}>
                    <p className="font-medium">{t(STAGE_KEYS[stage])}</p>
                    {stage === order.status && <p className="text-xs text-brand-600">{t('orders.currentStatus')}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
        {canCancel && (
          <>
            {error && <p className="mb-2 text-xs font-medium text-danger-500">{error}</p>}
            <Button variant="danger" onClick={handleCancel} loading={cancelling} className="mt-1">
              {t('orders.cancelOrder')}
            </Button>
          </>
        )}
      </div>

      {/* Delivery dispute — report a problem / show review status */}
      {openDispute && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-amber-900">This order is under review</p>
            <p className="mt-0.5 text-amber-800">
              You reported: "{openDispute.reason}". Our team is looking into it — we'll update you once it's resolved.
            </p>
          </div>
        </div>
      )}
      {canReportProblem && (
        <div className="mb-5 rounded-2xl border border-ink-100 bg-surface p-4">
          {!showDisputeForm ? (
            <button
              type="button"
              onClick={() => setShowDisputeForm(true)}
              className="text-sm font-semibold text-danger-500 hover:underline"
            >
              I did not receive this order / something's wrong
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink-900">Report a delivery problem</p>
              <input
                type="text"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder={'What went wrong? (e.g. "Never received the package")'}
                maxLength={200}
                className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <textarea
                value={disputeDetails}
                onChange={(e) => setDisputeDetails(e.target.value)}
                placeholder="Any extra details (optional)"
                maxLength={1000}
                rows={3}
                className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              {disputeError && <p className="text-xs font-medium text-danger-500">{disputeError}</p>}
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleReportProblem} loading={disputeSubmitting} disabled={!disputeReason.trim()}>
                  Submit report
                </Button>
                <Button variant="ghost" onClick={() => setShowDisputeForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="mb-5 space-y-2">
        {order.items.map((item) => (
          <div key={item.productId} className="flex justify-between rounded-xl bg-surface-sunk px-3 py-2 text-sm">
            <span className="text-ink-700">
              {item.name} × {item.quantity}
            </span>
            <span className="font-medium text-ink-900">{formatINR(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm text-ink-600">
        <p className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
          {order.address}
        </p>
        <p className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-brand-600" aria-hidden="true" />
          {t('orders.paidVia')} {order.paymentMethod}
        </p>
      </div>
    </div>
  )
}
