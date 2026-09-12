declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance
  }
}

export type RazorpayCheckoutOptions = {
  key: string
  amount?: number
  currency?: string
  name?: string
  description?: string
  order_id?: string
  subscription_id?: string
  theme?: { color?: string }
  handler: (response: RazorpaySuccessResponse) => void
  modal?: { ondismiss?: () => void }
}

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id?: string
  razorpay_subscription_id?: string
  razorpay_signature: string
}

type RazorpayInstance = { open: () => void; on: (event: string, handler: (err: unknown) => void) => void }

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js'
let scriptPromise: Promise<void> | null = null

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout is only available in the browser'))
  }
  if (window.Razorpay) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
    document.body.appendChild(script)
  })
  return scriptPromise
}

export async function openRazorpayCheckout(
  options: Omit<RazorpayCheckoutOptions, 'handler'>
): Promise<RazorpaySuccessResponse> {
  await loadRazorpayScript()
  if (!window.Razorpay) throw new Error('Razorpay failed to load')
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      ...options,
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    })
    rzp.on('payment.failed', () => reject(new Error('Payment failed')))
    rzp.open()
  })
}
