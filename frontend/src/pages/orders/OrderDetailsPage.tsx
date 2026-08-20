<<<<<<< HEAD
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronLeft, MapPin, Wallet } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { STATUS_SEQUENCE, useOrders } from '@/context/OrderContext'
import { orderService } from '@/services/orderService'
import { getApiErrorMessage } from '@/services/api'
import type { Order } from '@/types'
=======
import { Link, useParams } from 'react-router-dom'
import { Check, ChevronLeft, MapPin, Wallet } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useOrders } from '@/context/OrderContext'
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
import { formatINR, formatDateLabel } from '@/utils/format'
import { cn } from '@/utils/cn'

const STAGE_LABELS: Record<string, string> = {
  placed: 'Order Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
<<<<<<< HEAD
  out_for_delivery: 'Out for Delivery',
=======
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
  delivered: 'Delivered',
}

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
<<<<<<< HEAD
  const { refresh: refreshOrders } = useOrders()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    orderService
      .getOne(id)
      .then((o) => {
        if (!cancelled) setOrder(o)
      })
      .catch(() => {
        if (!cancelled) setOrder(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleCancel() {
    if (!id) return
    setCancelling(true)
    setError('')
    try {
      const updated = await orderService.cancel(id)
      setOrder(updated)
      await refreshOrders()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not cancel this order.'))
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-ink-400">Loading…</div>
  }
=======
  const { getOrder, statusSequence, advanceStatus } = useOrders()
  const order = getOrder(id ?? '')
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">Order not found.</p>
        <Link to="/orders" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    )
  }

<<<<<<< HEAD
  const isTerminalOffPath = order.status === 'cancelled' || order.status === 'returned'
  const currentIndex = STATUS_SEQUENCE.indexOf(order.status)
  const canCancel = order.status === 'placed' || order.status === 'confirmed'
=======
  const currentIndex = statusSequence.indexOf(order.status)
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <Link to="/orders" className="mb-4 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All Orders
      </Link>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl">#{order.id}</h1>
          <p className="text-xs text-ink-400">Placed {formatDateLabel(order.placedAt)}</p>
        </div>
        <p className="text-lg font-bold text-ink-900">{formatINR(order.total)}</p>
      </div>

      {/* Tracker */}
      <div className="mb-6 rounded-2xl border border-ink-100 bg-surface p-4">
<<<<<<< HEAD
        {isTerminalOffPath ? (
          <p className={cn('text-sm font-semibold', order.status === 'cancelled' ? 'text-danger-500' : 'text-ink-500')}>
            This order was {order.status}.
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
                    <p className="font-medium">{STAGE_LABELS[stage]}</p>
                    {stage === order.status && <p className="text-xs text-brand-600">Current status</p>}
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
              Cancel Order
            </Button>
          </>
=======
        <ol>
          {statusSequence.map((stage, index) => {
            const done = index <= currentIndex
            const isLast = index === statusSequence.length - 1
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
                  <p className="font-medium">{STAGE_LABELS[stage]}</p>
                  {stage === order.status && <p className="text-xs text-brand-600">Current status</p>}
                </div>
              </li>
            )
          })}
        </ol>
        {order.status !== 'delivered' && (
          <Button variant="secondary" onClick={() => advanceStatus(order.id)} className="mt-1">
            Simulate next update
          </Button>
>>>>>>> cf6a738fce20220a517234faf239f88d85d4d33a
        )}
      </div>

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
          Paid via {order.paymentMethod}
        </p>
      </div>
    </div>
  )
}
