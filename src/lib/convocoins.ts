/** 1 ConvoCoin (CC) = ₹1 */
export const CC_PER_INR = 1;

/** Keep paise precision — never round away 0.30 / 1.23 style charges. */
export function inrToCc(amountInr: number): number {
  return Math.round(amountInr * 100 * CC_PER_INR) / 100;
}

export function paiseToCc(amountPaise: number): number {
  return Math.round(amountPaise) / 100;
}

export function ccToPaise(cc: number): number {
  return Math.round(cc * 100);
}

export function formatCc(cc: number, options?: { compact?: boolean }): string {
  const value = Number.isFinite(cc) ? cc : 0;
  const formatted = value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return options?.compact ? `${formatted} CC` : `${formatted} CC`;
}

export function formatCcInrSubtitle(cc: number): string {
  return `≈ ₹${cc.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const CONVOCOIN_ASSET = '/cc.png';
export const BRAND_PURPLE = '#7C3AED';
export const BRAND_GOLD = '#F59E0B';
