/** Matches backend usageCost.constants.ts — client-side estimate only, no live endpoint. */
export const WALLET_CC_RATES = {
  waMarketing: 1,
  waUtility: 0.3,
  waAuth: 0.3,
  instagram: 0.01,
  email: 1,
} as const

export function formatCc(cc: number): string {
  const value = Number.isFinite(cc) ? cc : 0
  return `${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CC`
}

export function waTemplateRateCc(category: string | undefined): { rate: number; label: string } {
  const key = (category ?? 'utility').trim().toUpperCase()
  if (key === 'MARKETING') return { rate: WALLET_CC_RATES.waMarketing, label: 'Marketing' }
  if (key === 'AUTHENTICATION') return { rate: WALLET_CC_RATES.waAuth, label: 'Authentication' }
  return { rate: WALLET_CC_RATES.waUtility, label: 'Utility' }
}

export function metersWhatsAppCc(paymentMode: 'self_pay' | 'platform' | null | undefined): boolean {
  return paymentMode === 'platform'
}

export function metersEmailCc(defaultProvider: string | null | undefined): boolean {
  if (!defaultProvider) return true
  return defaultProvider === 'CONVOSYNC_MANAGED' || defaultProvider === 'WABIZ_MANAGED'
}

export function estimateCampaignCostCc(input: {
  channel: 'whatsapp' | 'email' | 'instagram'
  audienceCount: number
  waCategory?: string
  waPaymentMode?: 'self_pay' | 'platform' | null
  emailDefaultProvider?: string | null
}): { show: boolean; cc: number; rateLabel: string } {
  const n = input.audienceCount
  if (input.channel === 'whatsapp') {
    if (!metersWhatsAppCc(input.waPaymentMode)) return { show: false, cc: 0, rateLabel: '' }
    const { rate, label } = waTemplateRateCc(input.waCategory)
    return {
      show: true,
      cc: Math.round(n * rate * 100) / 100,
      rateLabel: `${rate} CC / conversation · ${label}`,
    }
  }
  if (input.channel === 'email') {
    if (!metersEmailCc(input.emailDefaultProvider)) return { show: false, cc: 0, rateLabel: '' }
    return {
      show: true,
      cc: Math.round(n * WALLET_CC_RATES.email * 100) / 100,
      rateLabel: `${WALLET_CC_RATES.email} CC / send`,
    }
  }
  return {
    show: true,
    cc: Math.round(n * WALLET_CC_RATES.instagram * 100) / 100,
    rateLabel: `${WALLET_CC_RATES.instagram} CC / message`,
  }
}
