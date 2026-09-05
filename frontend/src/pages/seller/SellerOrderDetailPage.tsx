import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Mail,
  MapPin,
  Package,
  Phone,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { orderService } from '@/services/orderService'
import { getApiErrorMessage } from '@/services/api'
import { formatDateTimeLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Carrier, SellerOrderDetail } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  placed: 'bg-ink-100 text-ink-600',
  confirmed: 'bg-sky-50 text-sky-700',
  packed: 'bg-gold-50 text-gold-700',
  shipped: 'bg-brand-50 text-brand-700',
  out_for_delivery: 'bg-amber-100 text-amber-800',
  delivered: 'bg-brand-100 text-brand-800',
  delivery_failed: 'bg-danger-50 text-danger-500',
  disputed: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-danger-50 text-danger-500',
  returned: 'bg-danger-50 text-danger-500',
}

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [order, setOrder] = useState<SellerOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [showAwbForm, setShowAwbForm] = useState(false)
  const [selectedCarrierCode, setSelectedCarrierCode] = useState('')
  const [customCarrierName, setCustomCarrierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shipmentNote, setShipmentNote] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setLoadError('')
    try {
      const detail = await orderService.getSellerOrderDetail(id)
      setOrder(detail)
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not load this order.'))
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    orderService
      .getCarriers()
      .then((list) => {
        setCarriers(list)
        setSelectedCarrierCode((prev) => prev || list[0]?.code || '')
      })
      .catch(() => {})
  }, [])

  // The seller's ENTIRE action on this order: submit courier + AWB. This
  // moves the order straight to "shipped" and notifies the buyer — there's
  // no separate courier-confirmed pickup step anymore.
  async function submitAwb() {
    if (!order || !id) return
    setFormError('')
    if (!selectedCarrierCode) {
      setFormError('Please select a delivery carrier.')
      return
    }
    if (selectedCarrierCode === 'OTHER' && !customCarrierName.trim()) {
      setFormError('Please name the courier or local agent.')
      return
    }
    if (!trackingNumber.trim()) {
      setFormError('Please enter the AWB / tracking number.')
      return
    }
    setSubmitting(true)
    try {
      await orderService.submitShipment(id, {
        carrierCode: selectedCarrierCode,
        awb: trackingNumber.trim(),
        carrierName: selectedCarrierCode === 'OTHER' ? customCarrierName.trim() : undefined,
        note: shipmentNote.trim() || undefined,
      })
      setShowAwbForm(false)
      setTrackingNumber('')
      setCustomCarrierName('')
      setShipmentNote('')
      await load() // pull the fresh status + shipment info + status history
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not submit this AWB. Double-check the carrier and number.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-400">Loading order…</p>
      </div>
    )
  }

  if (loadError || !order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-danger-500">{loadError || 'Order not found.'}</p>
        <button type="button" onClick={() => navigate('/seller/orders')} className="mt-4 text-xs font-semibold text-brand-600 hover:underline">
          Back to Orders
        </button>
      </div>
    )
  }

  const openDispute = order.disputes?.find((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW')

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <Link to="/seller/orders" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Orders to Fulfill
      </Link>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Order #{order.id}</h1>
          <p className="mt-0.5 text-xs text-ink-500">Placed {formatDateTimeLabel(order.placedAt)}</p>
        </div>
        <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize', STATUS_STYLES[order.status])}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {openDispute && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-amber-900">Buyer reported a delivery problem</p>
            <p className="mt-0.5 text-amber-800">"{openDispute.reason}" — our team is reviewing it. No action needed from you right now.</p>
          </div>
        </div>
      )}

      {/* Customer & delivery details */}
      <section className="mb-4 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <MapPin className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Delivery Details
        </h2>
        <div className="space-y-1.5 text-sm text-ink-800">
          <p className="flex items-center gap-1.5 font-semibold">
            <UserIcon className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
            {order.address.fullName}
          </p>
          <p className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
            <a href={`tel:${order.address.phone}`} className="text-brand-600 hover:underline">
              {order.address.phone}
            </a>
          </p>
          <p className="pl-5 text-ink-600">
            {order.address.line1}
            {order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city}, {order.address.state} – {order.address.pincode}
          </p>
        </div>

        <div className="mt-3 border-t border-ink-100 pt-3 text-xs text-ink-500">
          <p className="mb-1 font-semibold text-ink-700">Buyer account</p>
          <p>{order.customer.name}</p>
          {order.customer.email && (
            <p className="mt-0.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <a href={`mailto:${order.customer.email}`} className="text-brand-600 hover:underline">
                {order.customer.email}
              </a>
            </p>
          )}
        </div>
      </section>

      {/* Items */}
      <section className="mb-4 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Package className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Items in this Order
        </h2>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-sunk text-brand-600">
                {item.image ? (
                  <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <Package className="h-5 w-5" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-ink-900">{item.name}</p>
                <p className="text-xs text-ink-400">
                  {formatINR(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-900">{formatINR(item.totalPrice)}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1 border-t border-ink-100 pt-3 text-xs text-ink-500">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{order.shippingFee > 0 ? formatINR(order.shippingFee) : 'Free'}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{formatINR(order.tax)}</span>
          </div>
          <div className="flex justify-between pt-1 text-sm font-bold text-ink-900">
            <span>Total</span>
            <span>{formatINR(order.total)}</span>
          </div>
        </div>
      </section>

      {/* Payment */}
      {order.paymentStatus && (
        <section className="mb-4 rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-2 text-sm font-bold text-ink-900">Payment</h2>
          <p className="text-xs text-ink-600">
            Status: <span className="font-semibold capitalize text-ink-900">{order.paymentStatus.toLowerCase()}</span>
            {order.paymentMethod ? ` · ${order.paymentMethod}` : ''}
          </p>
        </section>
      )}

      {/* Shipping / AWB — the seller's ONLY action here is submitting the AWB once. Everything after that is courier-reported. */}
      <section className="mb-4 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Truck className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Shipping
        </h2>

        {order.shipment ? (
          <div className="text-sm text-ink-800">
            <p>
              <span className="text-ink-500">Carrier: </span>
              <span className="font-semibold">{order.shipment.carrierName || order.shipment.carrierCode}</span>
            </p>
            <p className="mt-1">
              <span className="text-ink-500">AWB / Tracking No.: </span>
              <span className="font-semibold">{order.shipment.awb}</span>
            </p>
            {order.shipment.shipmentDate && (
              <p className="mt-1">
                <span className="text-ink-500">Shipped on: </span>
                <span className="font-semibold">{formatDateTimeLabel(order.shipment.shipmentDate)}</span>
              </p>
            )}
            {order.shipment.note && <p className="mt-1 text-xs text-ink-500">{order.shipment.note}</p>}

            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              <span className="font-medium text-brand-700">Shipment submitted</span>
            </div>

            {order.shipment.trackingUrl && (
              <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline">
                {order.shipment.trackingUrlIsDirect ? 'Track shipment →' : 'Open courier tracking page →'}
              </a>
            )}
            <p className="mt-2 text-xs text-ink-400">
              Delivery is confirmed by our team once verified with the courier — no further action needed from you here.
            </p>
          </div>
        ) : showAwbForm ? (
          <form
            className="rounded-xl border border-brand-200 bg-brand-50/60 p-4"
            onSubmit={(event) => {
              event.preventDefault()
              void submitAwb()
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="text-xs text-ink-600">Select the delivery carrier and enter the AWB / tracking number. The order will be marked shipped and the buyer notified right away.</p>
              <button type="button" aria-label="Close" onClick={() => setShowAwbForm(false)} className="text-ink-500 hover:text-ink-900">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mb-3">
              <label htmlFor="carrier" className="mb-1 block text-xs font-semibold text-ink-700">
                Delivery Carrier
              </label>
              <select
                id="carrier"
                value={selectedCarrierCode}
                onChange={(e) => setSelectedCarrierCode(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {carriers.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCarrierCode === 'OTHER' && (
              <div className="mb-3">
                <TextField
                  id="custom-carrier"
                  label="Courier / Local Agent Name"
                  value={customCarrierName}
                  onChange={(event) => setCustomCarrierName(event.target.value)}
                  placeholder="e.g. Local Tempo, Regional Agent"
                  required
                />
              </div>
            )}

            <TextField
              id="awb"
              label="AWB / Tracking Number"
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
              placeholder="e.g. 1234567890"
              minLength={4}
              maxLength={40}
              required
              hint="4–40 characters"
              error={formError || undefined}
            />

            <div className="mt-3">
              <TextField
                id="shipment-note"
                label="Note (optional)"
                value={shipmentNote}
                onChange={(event) => setShipmentNote(event.target.value)}
                placeholder="e.g. Handed to courier at the local branch"
                maxLength={500}
              />
            </div>

            <div className="mt-3 flex gap-2">
              <Button type="submit" className="h-9 px-4 text-xs" loading={submitting}>
                Submit AWB
              </Button>
              <Button type="button" variant="ghost" className="h-9 px-3 text-xs" disabled={submitting} onClick={() => setShowAwbForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : order.status === 'placed' || order.status === 'confirmed' || order.status === 'packed' ? (
          <Button variant="secondary" className="h-9 px-4 text-xs" onClick={() => { setFormError(''); setTrackingNumber(''); setCustomCarrierName(''); setShipmentNote(''); setShowAwbForm(true) }}>
            Enter AWB & Ship Order
          </Button>
        ) : (
          <p className="text-xs text-ink-400">No tracking info yet.</p>
        )}
      </section>

      {/* Status timeline */}
      {order.statusHistory.length > 0 && (
        <section className="rounded-2xl border border-ink-100 bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold text-ink-900">Status Timeline</h2>
          <ol className="space-y-2.5">
            {order.statusHistory.map((h, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                <div>
                  <span className="font-semibold capitalize text-ink-900">{h.status.replace(/_/g, ' ')}</span>
                  <span className="ml-2 text-ink-400">{formatDateTimeLabel(h.changedAt)}</span>
                  {h.note && <p className="mt-0.5 text-ink-500">{h.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
