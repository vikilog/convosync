/** GST on ConvoCoins recharge (India). */
export const WALLET_RECHARGE_GST_RATE = 0.18;

/** Estimated Razorpay domestic processing fee. */
export const WALLET_RAZORPAY_FEE_RATE = 0.02;

export type WalletRechargeQuote = {
  cc: number;
  baseInr: number;
  gstInr: number;
  razorpayFeeInr: number;
  totalInr: number;
  totalPaise: number;
  basePaise: number;
};

function roundInr(value: number): number {
  return Math.round(value * 100) / 100;
}

/** 1 CC = ₹1 base recharge value. */
export function computeWalletRechargeQuote(cc: number): WalletRechargeQuote {
  const baseInr = cc;
  const gstInr = roundInr(baseInr * WALLET_RECHARGE_GST_RATE);
  const subtotalInr = baseInr + gstInr;
  const razorpayFeeInr = roundInr(subtotalInr * WALLET_RAZORPAY_FEE_RATE);
  const totalInr = roundInr(subtotalInr + razorpayFeeInr);

  return {
    cc,
    baseInr,
    gstInr,
    razorpayFeeInr,
    totalInr,
    totalPaise: Math.round(totalInr * 100),
    basePaise: cc * 100,
  };
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
