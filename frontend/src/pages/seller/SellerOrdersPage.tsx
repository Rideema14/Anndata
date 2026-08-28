import { PackageCheck, User, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { TextField } from '@/components/common/FormField'
import { useSeller } from '@/context/SellerContext'
import { getApiErrorMessage } from '@/services/api'
import { formatDateTimeLabel, formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  placed: 'bg-ink-100 text-ink-600',
  confirmed: 'bg-sky-50 text-sky-700',
  packed: 'bg-gold-50 text-gold-700',
  shipped: 'bg-brand-50 text-brand-700',
  out_for_delivery: 'bg-amber-100 text-amber-800',
  delivered: 'bg-brand-100 text-brand-800',
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

export default function SellerOrdersPage() {
  const { sellerOrders, isLoadingOrders, isUpdatingOrder, advanceSellerOrderStatus } = useSeller()
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null)
  const [selectedCarrier, setSelectedCarrier] = useState<string>('Delhivery')
  const [customCarrierName, setCustomCarrierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [error, setError] = useState('')

  async function confirmOrder(orderId: string) {
    setError('')
    const finalCarrier = selectedCarrier === 'CUSTOM' ? customCarrierName.trim() : selectedCarrier
    if (!finalCarrier) {
      setError('Please enter the delivery service or agent name.')
      return
    }

    try {
      await advanceSellerOrderStatus(orderId, { carrier: finalCarrier, number: trackingNumber })
      setConfirmingOrderId(null)
      setTrackingNumber('')
      setCustomCarrierName('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not confirm this order.'))
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
          const isConfirmed = order.status !== 'placed'
          return (
            <div key={order.id} className="rounded-2xl border border-ink-100 bg-surface p-4">
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
              <div className="mt-3 grid grid-cols-[1fr,auto] gap-x-4 gap-y-1">
                <span className="text-[11px] text-ink-400">Placed: {formatDateTimeLabel(order.placedAt)}</span>
                <span className="row-span-2 place-self-center text-sm font-bold text-ink-900">{formatINR(order.total)}</span>
                <span className="text-[11px] text-ink-400">Updated: {formatDateTimeLabel(order.updatedAt)}</span>
              </div>

              {order.status === 'placed' && confirmingOrderId === order.id ? (
                <form
                  className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void confirmOrder(order.id)
                  }}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">Confirm Order & Assign Delivery</p>
                      <p className="mt-0.5 text-xs text-ink-600">Select any delivery platform, courier, or local transport agent and enter the tracking/AWB number.</p>
                    </div>
                    <button type="button" aria-label="Close confirmation form" onClick={() => setConfirmingOrderId(null)} className="text-ink-500 hover:text-ink-900">
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mb-3">
                    <label htmlFor={`carrier-${order.id}`} className="mb-1 block text-xs font-semibold text-ink-700">
                      Delivery Platform / Agent / Service
                    </label>
                    <select
                      id={`carrier-${order.id}`}
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
                        id={`custom-carrier-${order.id}`}
                        label="Custom Courier / Transport Name"
                        value={customCarrierName}
                        onChange={(event) => setCustomCarrierName(event.target.value)}
                        placeholder="e.g. Speed Post, VRL Logistics, Local Tempo"
                        required
                      />
                    </div>
                  )}

                  <TextField
                    id={`awb-${order.id}`}
                    label="Tracking / AWB / Docket Number"
                    value={trackingNumber}
                    onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
                    placeholder="e.g. 1234567890"
                    pattern="[A-Za-z0-9_-]{4,50}"
                    minLength={4}
                    maxLength={50}
                    required
                    hint="4–50 characters"
                    error={error || undefined}
                  />

                  <div className="mt-3 flex gap-2">
                    <Button type="submit" className="h-9 px-4 text-xs" loading={isUpdatingOrder}>
                      Confirm Order
                    </Button>
                    <Button type="button" variant="ghost" className="h-9 px-3 text-xs" disabled={isUpdatingOrder} onClick={() => setConfirmingOrderId(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : !isConfirmed ? (
                <Button
                  variant="secondary"
                  className="mt-3 h-9 px-4 text-xs"
                  disabled={isUpdatingOrder}
                  onClick={() => {
                    setError('')
                    setTrackingNumber('')
                    setSelectedCarrier('Delhivery')
                    setCustomCarrierName('')
                    setConfirmingOrderId(order.id)
                  }}
                >
                  Confirm Order
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
