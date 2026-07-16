import { WALLET_CC_RATES, WALLET_PRICING_ROWS, type WalletPricingKey } from './walletPricing';

/** ConvoCoins charged per unit (1 CC = ₹1). */
export const WALLET_USAGE_RATE_CC = WALLET_CC_RATES;

export type WalletUsageField = Exclude<WalletPricingKey, 'inbox'>;

const CALCULATOR_ROWS = WALLET_PRICING_ROWS.filter((row) => row.calculator);

export const WALLET_USAGE_FIELDS: ReadonlyArray<{
  key: WalletUsageField;
  label: string;
  hint: string;
  step: number;
  sliderMax: number;
}> = CALCULATOR_ROWS.map((row) => ({
  key: row.key as WalletUsageField,
  label: row.feature,
  hint: row.calculatorHint ?? `${row.rateCcDisplay} / use`,
  step: 1,
  sliderMax: row.sliderMax ?? 10000,
}));

export type WalletUsageCounts = Record<WalletUsageField, number>;

export const EMPTY_WALLET_USAGE: WalletUsageCounts = {
  waMarketing: 0,
  waUtility: 0,
  waAuth: 0,
  instagram: 0,
  email: 0,
  aiAgent: 0,
  journeyTrigger: 0,
};

export function computeWalletUsageTotalCc(counts: WalletUsageCounts): number {
  let total = 0;
  for (const field of WALLET_USAGE_FIELDS) {
    const qty = Math.max(0, counts[field.key] || 0);
    total += qty * WALLET_USAGE_RATE_CC[field.key];
  }
  return Math.round(total * 100) / 100;
}

export function computeWalletUsageBreakdown(counts: WalletUsageCounts) {
  return WALLET_USAGE_FIELDS.map((field) => {
    const quantity = Math.max(0, counts[field.key] || 0);
    const cc = Math.round(quantity * WALLET_USAGE_RATE_CC[field.key] * 100) / 100;
    return { ...field, quantity, cc };
  }).filter((row) => row.quantity > 0);
}
