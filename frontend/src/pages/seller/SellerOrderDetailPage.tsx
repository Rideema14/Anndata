import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
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
import { useSeller } from '@/context/SellerContext'
import { orderService } from '@/services/orderService'
import { getApiErrorMessage } from '@/services/api'
import { formatDateTimeLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { SellerOrderDetail } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  placed: 'bg-ink-100 text-ink-600',
  confirmed: 'bg-sky-50 text-sky-700',
  packed: 'bg-gold-50 text-gold-700',
  shipped: 'bg-brand-50 text-brand-700',
  out_for_delivery: 'bg-amber-100 text-amber-800',
  delivered: 'bg-brand-100 text-brand-800',
  cancelled: 'bg-danger-50 text-danger-500',
  returned: 'bg-danger-50 text-danger-500',
}

const CARRIER_OPTIONS = [
  { value: 'Delhivery', label: 'Delhivery' },
  { value: 'BlueDart', label: 'BlueDart' },
  { value: 'DTDC', label: 'DTDC' },
  { value: 'India Post', label: 'India Post' },
  { value: 'Ekart Logistics', label: 'Ekart Logistics' },
  { value: 'XpressBees', label: 'XpressBees' },
  { value: 'Shadowfax', label: 'Shadowfax' },
  { value: 'Ecom Express', label: 'Ecom Express' },
  { value: 'Porter', label: 'Porter' },
  { value: 'Dunzo', label: 'Dunzo' },
  { value: 'SafeExpress', label: 'SafeExpress' },
  { value: 'VRL Logistics', label: 'VRL Logistics' },
  { value: 'Local Transport', label: 'Local Transport / Agent' },
  { value: 'CUSTOM', label: '+ Enter Custom Carrier...' },
]

export default function SellerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { advanceSellerOrderStatus, isUpdatingOrder } = useSeller()

  const [order, setOrder] = useState<SellerOrderDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [showAwbForm, setShowAwbForm] = useState(false)
  const [selectedCarrier, setSelectedCarrier] = useState('Delhivery')
  const [customCarrierName, setCustomCarrierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [formError, setFormError] = useState('')

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

  async function confirmOrder() {
    if (!order) return
    setFormError('')
    const finalCarrier = selectedCarrier === 'CUSTOM' ? customCarrierName.trim() : selectedCarrier
    if (!finalCarrier) {
      setFormError('Please enter the delivery service or agent name.')
      return
    }
    try {
      await advanceSellerOrderStatus(order.id, { carrier: finalCarrier, number: trackingNumber })
      setShowAwbForm(false)
      setTrackingNumber('')
      setCustomCarrierName('')
      await load() // pull the fresh status + tracking info + status history
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not confirm this order.'))
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

      {/* Shipping / AWB */}
      <section className="mb-4 rounded-2xl border border-ink-100 bg-surface p-4">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-ink-900">
          <Truck className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Shipping
        </h2>

        {order.trackingNumber ? (
          <div className="text-sm text-ink-800">
            <p>
              <span className="text-ink-500">Carrier: </span>
              <span className="font-semibold">{order.trackingCarrier}</span>
            </p>
            <p className="mt-1">
              <span className="text-ink-500">AWB / Tracking No.: </span>
              <span className="font-semibold">{order.trackingNumber}</span>
            </p>
            {order.trackingUrl && (
              <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-brand-600 hover:underline">
                Track shipment →
              </a>
            )}
            <p className="mt-2 text-xs text-ink-400">
              Status now updates automatically from the carrier — no further action needed here.
            </p>
          </div>
        ) : showAwbForm ? (
          <form
            className="rounded-xl border border-brand-200 bg-brand-50/60 p-4"
            onSubmit={(event) => {
              event.preventDefault()
              void confirmOrder()
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <p className="text-xs text-ink-600">Select any delivery platform, courier, or local transport agent and enter the tracking/AWB number.</p>
              <button type="button" aria-label="Close" onClick={() => setShowAwbForm(false)} className="text-ink-500 hover:text-ink-900">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mb-3">
              <label htmlFor="carrier" className="mb-1 block text-xs font-semibold text-ink-700">
                Delivery Platform / Agent / Service
              </label>
              <select
                id="carrier"
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {CARRIER_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedCarrier === 'CUSTOM' && (
              <div className="mb-3">
                <TextField
                  id="custom-carrier"
                  label="Custom Courier / Transport Name"
                  value={customCarrierName}
                  onChange={(event) => setCustomCarrierName(event.target.value)}
                  placeholder="e.g. Speed Post, VRL Logistics, Local Tempo"
                  required
                />
              </div>
            )}

            <TextField
              id="awb"
              label="Tracking / AWB / Docket Number"
              value={trackingNumber}
              onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
              placeholder="e.g. 1234567890"
              pattern="[A-Za-z0-9_-]{4,50}"
              minLength={4}
              maxLength={50}
              required
              hint="4–50 characters"
              error={formError || undefined}
            />

            <div className="mt-3 flex gap-2">
              <Button type="submit" className="h-9 px-4 text-xs" loading={isUpdatingOrder}>
                Confirm Order
              </Button>
              <Button type="button" variant="ghost" className="h-9 px-3 text-xs" disabled={isUpdatingOrder} onClick={() => setShowAwbForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : order.status === 'placed' ? (
          <Button
            variant="secondary"
            className="h-9 px-4 text-xs"
            onClick={() => {
              setFormError('')
              setTrackingNumber('')
              setSelectedCarrier('Delhivery')
              setCustomCarrierName('')
              setShowAwbForm(true)
            }}
          >
            Confirm Order & Assign Delivery
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
