import { api } from './api'

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void }
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description?: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}
interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

let scriptPromise: Promise<boolean> | null = null

function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true)
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

export const paymentService = {
  /**
   * Opens the Razorpay Checkout widget for a payment already created by
   * `orderService.checkout`. Requires VITE_RAZORPAY_KEY_ID to be set (the
   * public key id — safe to expose client-side — matching the backend's
   * RAZORPAY_KEY_ID). Resolves once the widget's handler fires with a
   * successful, server-verified payment; rejects if the script fails to
   * load, the key is missing, or verification fails.
   */
  async openCheckout(options: {
    razorpayOrderId: string
    amountInRupees: number
    name: string
    email?: string
    phone?: string
  }): Promise<void> {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
    if (!keyId) {
      throw new Error('Razorpay is not configured on the frontend (VITE_RAZORPAY_KEY_ID missing).')
    }
    const loaded = await loadRazorpayScript()
    if (!loaded || !window.Razorpay) {
      throw new Error('Could not load the Razorpay checkout script.')
    }

    return new Promise((resolve, reject) => {
      const razorpay = new window.Razorpay!({
        key: keyId,
        amount: Math.round(options.amountInRupees * 100),
        currency: 'INR',
        name: 'Aandata',
        description: 'Order payment',
        order_id: options.razorpayOrderId,
        prefill: { name: options.name, email: options.email, contact: options.phone },
        theme: { color: '#2A6B3F' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            resolve()
          } catch (err) {
            reject(err)
          }
        },
        modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
      })
      razorpay.open()
    })
  },
}
