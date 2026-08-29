import { PackageCheck, User, X, ChevronRight, AlertTriangle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { useSeller } from '@/context/SellerContext'
import { orderService } from '@/services/orderService'
import { getApiErrorMessage } from '@/services/api'
import { formatDateTimeLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { Carrier } from '@/types'

const STATUS_STYLES: Record<string, string> = {
  placed: 'bg-ink-100 text-ink-600',
  confirmed: 'bg-sky-50 text-sky-700',
  packed: 'bg-gold-50 text-gold-700',
  shipped: 'bg-brand-50 text-brand-700',
  out_for_delivery: 'bg-amber-100 text-amber-800',
  delivered: 'bg-brand-100 text-brand-800',
  disputed: 'bg-amber-100 text-amber-800',
}

export default function SellerOrdersPage() {
  const { sellerOrders, isLoadingOrders, isUpdatingOrder, submitShipmentForOrder } = useSeller()
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null)
  const [selectedCarrierCode, setSelectedCarrierCode] = useState('')
  const [customCarrierName, setCustomCarrierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    orderService
      .getCarriers()
      .then((list) => {
        setCarriers(list)
        setSelectedCarrierCode((prev) => prev || list[0]?.code || '')
      })
      .catch(() => {})
  }, [])

  // The seller's ENTIRE action here: submit the AWB for verification. The
  // backend confirms it with the carrier before accepting it — everything
  // after this (pickup, transit, delivery) comes from the courier only.
  async function submitAwb(orderId: string) {
    setError('')
    if (!selectedCarrierCode) {
      setError('Please select a delivery carrier.')
      return
    }
    if (selectedCarrierCode === 'OTHER' && !customCarrierName.trim()) {
      setError('Please name the courier or local agent.')
      return
    }
    if (!trackingNumber.trim()) {
      setError('Please enter the AWB / tracking number.')
      return
    }

    try {
      await submitShipmentForOrder(orderId, {
        carrierCode: selectedCarrierCode,
        awb: trackingNumber.trim(),
        carrierName: selectedCarrierCode === 'OTHER' ? customCarrierName.trim() : undefined,
      })
      setConfirmingOrderId(null)
      setTrackingNumber('')
      setCustomCarrierName('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not submit this AWB. Double-check the carrier and number.'))
    }
  }

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
      <h1 className="mb-5 text-xl font-bold text-ink-900">Orders to Fulfill</h1>
      <div className="space-y-3">
        {sellerOrders.map((order) => {
          const needsAwb = !order.shipment
          return (
            <div key={order.id} className="rounded-2xl border border-ink-100 bg-surface p-4">
              <Link to={`/seller/orders/${order.id}`} className="block">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">#{order.id}</p>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize', STATUS_STYLES[order.status])}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-500">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                  {order.buyerName}
                </p>
                <p className="mt-1 text-xs text-ink-500">{order.itemsLabel}</p>
                {order.shipment && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                    {order.shipment.verified ? (
                      <span className="flex items-center gap-1 font-medium text-brand-700">AWB {order.shipment.awb} · verified</span>
                    ) : (
                      <span className="flex items-center gap-1 font-medium text-amber-700">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        AWB {order.shipment.awb} · verifying…
                      </span>
                    )}
                    {order.shipment.flaggedForReview && (
                      <span className="flex items-center gap-1 font-medium text-danger-500">
                        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                        Flagged
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-[1fr,auto] gap-x-4 gap-y-1">
                  <span className="text-[11px] text-ink-400">Placed: {formatDateTimeLabel(order.placedAt)}</span>
                  <span className="row-span-2 place-self-center text-sm font-bold text-ink-900">{formatINR(order.total)}</span>
                  <span className="text-[11px] text-ink-400">Updated: {formatDateTimeLabel(order.updatedAt)}</span>
                </div>
                <span className="mt-2 flex items-center gap-0.5 text-[11px] font-semibold text-brand-600">
                  View order & customer details
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </Link>

              {needsAwb && confirmingOrderId === order.id ? (
                <form
                  className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void submitAwb(order.id)
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">Enter AWB & Ship Order</p>
                      <p className="mt-0.5 text-xs text-ink-600">Select the delivery carrier and enter the AWB / tracking number. We'll verify it with the carrier before confirming the order.</p>
                    </div>
                    <button type="button" aria-label="Close confirmation form" onClick={() => setConfirmingOrderId(null)} className="text-ink-500 hover:text-ink-900">
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mb-3">
                    <label htmlFor={`carrier-${order.id}`} className="mb-1 block text-xs font-semibold text-ink-700">
                      Delivery Carrier
                    </label>
                    <select
                      id={`carrier-${order.id}`}
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
                        id={`custom-carrier-${order.id}`}
                        label="Courier / Local Agent Name"
                        value={customCarrierName}
                        onChange={(event) => setCustomCarrierName(event.target.value)}
                        placeholder="e.g. Local Tempo, Regional Agent"
                        required
                      />
                    </div>
                  )}

                  <TextField
                    id={`awb-${order.id}`}
                    label="AWB / Tracking Number"
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
                    placeholder="e.g. 1234567890"
                    minLength={6}
                    maxLength={40}
                    required
                    hint="6–40 characters"
                    error={error || undefined}
                  />

                  <div className="mt-3 flex gap-2">
                    <Button type="submit" className="h-9 px-4 text-xs" loading={isUpdatingOrder}>
                      Submit AWB
                    </Button>
                    <Button type="button" variant="ghost" className="h-9 px-3 text-xs" disabled={isUpdatingOrder} onClick={() => setConfirmingOrderId(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : needsAwb ? (
                <Button
                  variant="secondary"
                  className="mt-3 h-9 px-4 text-xs"
                  disabled={isUpdatingOrder}
                  onClick={() => {
                    setError('')
                    setTrackingNumber('')
                    setCustomCarrierName('')
                    setConfirmingOrderId(order.id)
                  }}
                >
                  Enter AWB & Ship Order
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
