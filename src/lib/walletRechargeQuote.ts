/** GST on ConvoCoins recharge (India). */
export const WALLET_RECHARGE_GST_RATE = 0.18;

/** Estimated Razorpay domestic processing fee. */
export const WALLET_RAZORPAY_FEE_RATE = 0.02;

/** Estimated Razorpay international card fee. */
export const WALLET_RAZORPAY_INTL_FEE_RATE = 0.03;

/** Fallback when FX not loaded (matches backend). */
export const USD_INR_FALLBACK = 83;

export type WalletRechargeQuote = {
  cc: number;
  currency: 'INR' | 'USD';
  baseInr: number;
  gstInr: number;
  razorpayFeeInr: number;
  totalInr: number;
  /** Charge amount in minor units (paise or cents). */
  totalPaise: number;
  /** ConvoCoin credit in paise-equivalent (1 CC = ₹1), currency-independent. */
  basePaise: number;
  /** USD charge breakdown when currency is USD. */
  baseUsd?: number;
  feeUsd?: number;
  totalUsd?: number;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** 1 CC = ₹1 base recharge value. India: GST + domestic fee. Abroad: USD via FX, no GST. */
export function computeWalletRechargeQuote(
  cc: number,
  options?: { currency?: 'INR' | 'USD'; usdInrRate?: number }
): WalletRechargeQuote {
  const currency = options?.currency ?? 'INR';
  const basePaise = cc * 100;

  if (currency === 'USD') {
    const rate = options?.usdInrRate && options.usdInrRate > 0 ? options.usdInrRate : USD_INR_FALLBACK;
    const baseUsd = roundMoney(cc / rate);
    const feeUsd = roundMoney(baseUsd * WALLET_RAZORPAY_INTL_FEE_RATE);
    const totalUsd = roundMoney(baseUsd + feeUsd);
    return {
      cc,
      currency: 'USD',
      baseInr: cc,
      gstInr: 0,
      razorpayFeeInr: roundMoney(feeUsd * rate),
      totalInr: roundMoney(totalUsd * rate),
      totalPaise: Math.round(totalUsd * 100),
      basePaise,
      baseUsd,
      feeUsd,
      totalUsd,
    };
  }

  const baseInr = cc;
  const gstInr = roundMoney(baseInr * WALLET_RECHARGE_GST_RATE);
  const subtotalInr = baseInr + gstInr;
  const razorpayFeeInr = roundMoney(subtotalInr * WALLET_RAZORPAY_FEE_RATE);
  const totalInr = roundMoney(subtotalInr + razorpayFeeInr);

  return {
    cc,
    currency: 'INR',
    baseInr,
    gstInr,
    razorpayFeeInr,
    totalInr,
    totalPaise: Math.round(totalInr * 100),
    basePaise,
  };
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatWalletMoney(amount: number, currency: 'INR' | 'USD'): string {
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return formatInr(amount);
}
