import { api, getUserEmail, getUserName } from './api';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount?: number | string;
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  subscription_id?: string;
  recurring?: boolean | 0 | 1;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  config?: {
    display?: {
      language?: string;
      preferences?: { show_default_blocks?: boolean };
      blocks?: Record<
        string,
        { name?: string; instruments?: Array<{ method: string }> }
      >;
      sequence?: string[];
    };
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void; escape?: boolean };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';


/** Format phone for Razorpay prefill (+91XXXXXXXXXX). */
export function formatIndianContact(phone?: string | null): string | undefined {
  if (!phone?.trim()) return undefined;
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 10) return `+${digits}`;
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length > 0) return `+${digits}`;
  return undefined;
}

/** Load name, email, and company phone for checkout prefill. */
export async function resolveCheckoutPrefill(
  partial?: RazorpayCheckoutOptions['prefill']
): Promise<NonNullable<RazorpayCheckoutOptions['prefill']>> {
  const name = partial?.name ?? getUserName() ?? undefined;
  const email = partial?.email ?? getUserEmail() ?? undefined;
  let contact = partial?.contact ? formatIndianContact(partial.contact) : undefined;

  if (!contact) {
    try {
      const company = (await api.getCompanySettings()) as { phone?: string | null };
      contact = formatIndianContact(company.phone);
    } catch {
      // Company phone optional
    }
  }

  return { name, email, contact };
}

export function isRazorpayTestKey(keyId?: string | null): boolean {
  return Boolean(keyId?.startsWith('rzp_test_'));
}

export const RAZORPAY_TEST_UPI_HINT =
  'Test mode: enter UPI ID success@razorpay to simulate payment. QR scan does not work with real UPI apps in test mode — use live keys for QR.';

let scriptPromiseInner: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay checkout is only available in the browser'));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromiseInner) return scriptPromiseInner;

  scriptPromiseInner = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });

  return scriptPromiseInner;
}

function buildCheckoutOptions(
  options: Omit<RazorpayCheckoutOptions, 'handler'>,
  prefill: NonNullable<RazorpayCheckoutOptions['prefill']>
): RazorpayCheckoutOptions {
  const isSubscription = Boolean(options.subscription_id);

  return {
    ...options,
    currency: options.currency ?? 'INR',
    prefill,
    // Required for subscription auth / mandate flows
    ...(isSubscription ? { recurring: true as const } : {}),
    config: {
      display: {
        language: 'en',
        preferences: { show_default_blocks: true },
        blocks: {
          banks: {
            name: 'Pay via Card / Netbanking',
            instruments: [{ method: 'card' }, { method: 'netbanking' }],
          },
          upi: {
            name: 'Pay via UPI',
            instruments: [{ method: 'upi' }],
          },
        },
        sequence: ['block.upi', 'block.banks'],
        ...options.config?.display,
      },
      ...options.config,
    },
  };
}

export async function openRazorpayCheckout(
  options: Omit<RazorpayCheckoutOptions, 'handler'> & {
    onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
    onDismiss?: () => void;
    /** Skip auto-fetch of company phone when false */
    autoPrefillContact?: boolean;
  }
): Promise<void> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not available');
  }

  const { onSuccess, onDismiss, autoPrefillContact = true, ...checkoutOptions } = options;

  const prefill = autoPrefillContact
    ? await resolveCheckoutPrefill(checkoutOptions.prefill)
    : (checkoutOptions.prefill ?? {});

  if (!prefill.contact) {
    throw new Error(
      'Add a phone number in Settings → Company profile before paying (required for UPI).'
    );
  }

  const rzpOptions = buildCheckoutOptions(checkoutOptions, prefill);

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      ...rzpOptions,
      handler: async (response) => {
        try {
          await onSuccess(response);
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        escape: true,
        ondismiss: () => {
          onDismiss?.();
          reject(new Error('Payment cancelled'));
        },
      },
    });
    rzp.open();
  });
}
