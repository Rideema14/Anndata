import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, MapPin, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { StepperHeader } from '@/components/common/StepperHeader'
import { useCart, getDeliveryFee } from '@/context/CartContext'
import { useOrders } from '@/context/OrderContext'
import { useAuth } from '@/context/AuthContext'
import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'
import { getApiErrorMessage } from '@/services/api'
import { useLanguage } from '@/context/LanguageContext'
import { formatINR } from '@/utils/format'
import { cn } from '@/utils/cn'

export default function CheckoutPage() {
  const { user } = useAuth()
  const { lines, subtotal, clearCart } = useCart()
  const { refresh: refreshOrders } = useOrders()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const STEPS = [t('checkout.stepAddress'), t('checkout.stepSummary'), t('checkout.stepPayment'), t('checkout.stepSuccess')]

  const [step, setStep] = useState(0)
  const [addressId, setAddressId] = useState(user?.addresses.find((a) => a.isDefault)?.id ?? user?.addresses[0]?.id ?? '')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [placedOrderNumber, setPlacedOrderNumber] = useState<string | null>(null)

  const activeLines = lines.filter((l) => !l.savedForLater)
  const deliveryFee = getDeliveryFee(subtotal)
  const total = subtotal + deliveryFee
  const address = user?.addresses.find((a) => a.id === addressId)

  if (activeLines.length === 0 && !placedOrderNumber) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-sm text-ink-500">{t('checkout.emptyCart')}</p>
        <Link to="/market" className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:underline">
          {t('checkout.browseMarketplace')}
        </Link>
      </div>
    )
  }

  async function handlePlaceOrder() {
    if (!addressId) return
    setError('')
    setPlacing(true)
    try {
      const { order, razorpayOrderId, amount } = await orderService.checkout(addressId)

      if (razorpayOrderId && amount) {
        try {
          await paymentService.openCheckout({
            razorpayOrderId,
            amountInRupees: amount,
            name: user?.name ?? '',
            email: user?.email,
            phone: user?.phone,
          })
        } catch (payErr) {
          // Order already exists server-side (status PENDING) even if the payment step didn't complete —
          // let the person know and send them to the order instead of blocking on the widget.
          setError(getApiErrorMessage(payErr, t('checkout.paymentIncomplete')))
        }
      }

      await clearCart()
      await refreshOrders()
      setPlacedOrderNumber(order.id)
      setStep(3)
    } catch (err) {
      setError(getApiErrorMessage(err, t('checkout.couldNotPlaceOrder')))
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-5 md:px-6 md:py-8">
      <StepperHeader steps={STEPS} currentIndex={step} />

      {step === 0 && (
        <div>
          <h1 className="mb-4 text-lg">{t('checkout.deliveryAddress')}</h1>
          {user?.addresses.length === 0 && (
            <p className="mb-3 text-sm text-ink-500">
              {t('checkout.noSavedAddress')}{' '}
              <Link to="/profile" className="font-semibold text-brand-600 hover:underline">
                {t('checkout.addOne')}
              </Link>{' '}
              {t('checkout.beforeCheckingOut')}
            </p>
          )}
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
            {t('checkout.continue')}
          </Button>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1 className="mb-4 text-lg">{t('cart.orderSummary')}</h1>
          <div className="space-y-2">
            {activeLines.map((line) => (
              <div key={line.productId} className="flex justify-between rounded-xl bg-surface-sunk px-3 py-2 text-sm">
                <span className="text-ink-700">
                  {line.product?.name} × {line.quantity}
                </span>
                <span className="font-medium text-ink-900">{formatINR(line.lineTotal ?? 0)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 border-t border-ink-100 pt-3 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>{t('cart.subtotal')}</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>{t('cart.delivery')}</span>
              <span>{deliveryFee === 0 ? t('cart.free') : formatINR(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-ink-900">
              <span>{t('cart.total')}</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={() => setStep(0)}>
              {t('checkout.back')}
            </Button>
            <Button fullWidth onClick={() => setStep(2)}>
              {t('checkout.continue')}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1 className="mb-4 text-lg">{t('checkout.paymentTitle')}</h1>
          <div className="rounded-2xl border border-ink-100 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-ink-900">{t('checkout.securePayment')}</p>
                <p className="text-xs text-ink-500">{t('checkout.securePaymentDesc')}</p>
              </div>
            </div>
          </div>
          {address && (
            <p className="mt-3 text-xs text-ink-500">
              {t('checkout.deliveringTo')} {address.label} — {address.line1}, {address.city}
            </p>
          )}
          {error && <p className="mt-3 text-xs font-medium text-danger-500">{error}</p>}
          <div className="mt-5 flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)} disabled={placing}>
              {t('checkout.back')}
            </Button>
            <Button fullWidth onClick={handlePlaceOrder} loading={placing}>
              {t('checkout.payButton')} {formatINR(total)}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && placedOrderNumber && (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="text-xl">{t('checkout.orderPlaced')}</h1>
          <p className="mt-1 text-sm text-ink-500">{t('checkout.orderLabel')} #{placedOrderNumber} — {formatINR(total)}</p>
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/market')}>
              {t('checkout.continueShopping')}
            </Button>
            <Button onClick={() => navigate(`/orders/${placedOrderNumber}`)}>{t('checkout.trackOrder')}</Button>
          </div>
        </div>
      )}
    </div>
  )
}