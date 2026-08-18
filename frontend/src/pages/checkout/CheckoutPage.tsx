import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Banknote, CheckCircle2, CreditCard, MapPin, Smartphone } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { StepperHeader } from '@/components/common/StepperHeader'
import { useCart, getDeliveryFee } from '@/context/CartContext'
import { useOrders } from '@/context/OrderContext'
import { useAuth } from '@/context/AuthContext'
import { getProductById } from '@/data/mock/mockProductCatalog'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

const STEPS = ['Address', 'Summary', 'Payment', 'Success']
const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote },
]

export default function CheckoutPage() {
  const { user } = useAuth()
  const { lines, subtotal, clearCart } = useCart()
  const { placeOrder } = useOrders()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [addressId, setAddressId] = useState(user?.addresses[0]?.id ?? '')
  const [payment, setPayment] = useState('upi')
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)

  const activeLines = lines.filter((l) => !l.savedForLater)
  const deliveryFee = getDeliveryFee(subtotal)
  const total = subtotal + deliveryFee
  const address = user?.addresses.find((a) => a.id === addressId)

  if (activeLines.length === 0 && !placedOrderId) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">Your cart is empty.</p>
        <Link to="/market" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          Browse the marketplace
        </Link>
      </div>
    )
  }

  function handlePlaceOrder() {
    const items = activeLines
      .map((line) => {
        const product = getProductById(line.productId)
        if (!product) return null
        return { productId: product.id, name: product.name, quantity: line.quantity, price: product.price }
      })
      .filter((i): i is NonNullable<typeof i> => !!i)

    const order = placeOrder(items, address ? `${address.line1}, ${address.city}, ${address.state} – ${address.pincode}` : 'Address', payment)
    clearCart()
    setPlacedOrderId(order.id)
    setStep(3)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <StepperHeader steps={STEPS} currentIndex={step} />

      {step === 0 && (
        <div>
          <h1 className="mb-4 text-lg">Delivery Address</h1>
          <div className="space-y-3">
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
          <Button fullWidth className="mt-5" onClick={() => setStep(1)} disabled={!addressId}>
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="mb-4 text-lg">Order Summary</h1>
          <div className="space-y-2">
            {activeLines.map((line) => {
              const product = getProductById(line.productId)
              if (!product) return null
              return (
                <div key={line.productId} className="flex justify-between rounded-xl bg-surface-sunk px-3 py-2 text-sm">
                  <span className="text-ink-700">
                    {product.name} × {line.quantity}
                  </span>
                  <span className="font-medium text-ink-900">{formatINR(product.price * line.quantity)}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 space-y-1 border-t border-ink-100 pt-3 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Delivery</span>
              <span>{deliveryFee === 0 ? 'Free' : formatINR(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-ink-900">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button fullWidth onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="mb-4 text-lg">Payment</h1>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPayment(method.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-sm font-medium',
                  payment === method.id ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-ink-100 text-ink-700',
                )}
              >
                <method.icon className="h-4.5 w-4.5" aria-hidden="true" />
                {method.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-400">This is a frontend-only demo — no real payment is processed.</p>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button fullWidth onClick={handlePlaceOrder}>
              Place Order — {formatINR(total)}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && placedOrderId && (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="text-xl">Order placed!</h1>
          <p className="mt-1 text-sm text-ink-500">Order #{placedOrderId} — {formatINR(total)}</p>
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/market')}>
              Continue Shopping
            </Button>
            <Button onClick={() => navigate(`/orders/${placedOrderId}`)}>Track Order</Button>
          </div>
        </div>
      )}
    </div>
  )
}
