import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, MapPin, Minus, Plus, ShoppingCart, Sprout, Trash2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useSeedCart } from '@/context/SeedCartContext'
import { useAuth } from '@/context/AuthContext'
import { seedOrderService } from '@/services/seedService'
import { paymentService } from '@/services/paymentService'
import { getApiErrorMessage } from '@/services/api'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function SeedCartPage() {
  const { lines, removeFromCart, setQuantity, subtotal, clearCart, refreshSeedOrders } = useSeedCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [addressId, setAddressId] = useState(user?.addresses.find((a) => a.isDefault)?.id ?? user?.addresses[0]?.id ?? '')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [placedId, setPlacedId] = useState<string | null>(null)

  async function handlePlaceOrder() {
    if (!addressId) return
    setError('')
    setPlacing(true)
    try {
      const { order, razorpayOrderId, amount } = await seedOrderService.checkout(addressId)

      if (razorpayOrderId && amount) {
        try {
          await paymentService.openCheckout({
            razorpayOrderId,
            amountInRupees: amount,
            name: user?.name ?? '',
            email: user?.email,
            phone: user?.phone,
            description: 'Seed order payment',
            verifyEndpoint: '/seeds/payments/verify',
          })
        } catch (payErr) {
          setError(getApiErrorMessage(payErr, 'Order placed, but payment did not complete. You can retry from your seed orders.'))
        }
      }

      await clearCart()
      await refreshSeedOrders()
      setPlacedId(order.id)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not place the order.'))
    } finally {
      setPlacing(false)
    }
  }

  if (placedId) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="text-xl">Seed order placed!</h1>
        <p className="mt-1 text-sm text-ink-500">Order #{placedId}</p>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/seeds')}>
            Continue Shopping
          </Button>
          <Button onClick={() => navigate('/seeds/orders')}>View Seed Orders</Button>
        </div>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <ShoppingCart className="mb-3 h-12 w-12 text-ink-300" aria-hidden="true" />
        <h1 className="text-lg">Seed cart is empty</h1>
        <Link to="/seeds" className="mt-5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Browse Seed Store
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <h1 className="mb-5 text-xl">Seed Cart</h1>
      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.itemId} className="flex gap-3 rounded-2xl border border-ink-100 bg-surface p-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface-sunk">
              {line.seed.imageUrl ? (
                <img src={line.seed.imageUrl} alt={line.seed.name} className="h-full w-full object-cover" />
              ) : (
                <Sprout className="h-5 w-5 text-brand-400" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-medium text-ink-900">
                {line.seed.name}
                {line.variantName && <span className="text-ink-400"> · {line.variantName}</span>}
              </p>
              <p className="mt-0.5 text-sm font-bold text-ink-900">{formatINR(line.unitPrice)}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-ink-200">
                  <button
                    type="button"
                    onClick={() => setQuantity(line.seedId, line.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center"
                  >
                    <Minus className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <span className="w-6 text-center text-xs font-semibold">{line.quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(line.seedId, line.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(line.seedId)}
                  className="flex items-center gap-1 text-xs font-medium text-danger-500"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-ink-800">Deliver to</h2>
        {user?.addresses.length === 0 ? (
          <p className="text-xs text-ink-500">
            No saved address.{' '}
            <Link to="/profile" className="font-semibold text-brand-600 hover:underline">
              Add one
            </Link>{' '}
            before checking out.
          </p>
        ) : (
          <div className="space-y-2">
            {user?.addresses.map((addr) => (
              <button
                key={addr.id}
                type="button"
                onClick={() => setAddressId(addr.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-3 text-left',
                  addressId === addr.id ? 'border-brand-500 bg-brand-50' : 'border-ink-100',
                )}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-ink-900">{addr.label}</p>
                  <p className="text-xs text-ink-500">
                    {addr.line1}, {addr.city}, {addr.state} – {addr.pincode}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-ink-100 bg-surface p-4">
        <div className="flex justify-between text-sm font-bold text-ink-900">
          <span>Total</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        {error && <p className="mt-2 text-xs font-medium text-danger-500">{error}</p>}
        <Button fullWidth className="mt-3" onClick={handlePlaceOrder} loading={placing} disabled={!addressId}>
          Place Seed Order — {formatINR(subtotal)}
        </Button>
      </div>
    </div>
  )
}
