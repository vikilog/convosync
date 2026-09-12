import { describe, expect, it } from 'vitest'

import { estimateCampaignCostCc, formatCc, metersEmailCc, metersWhatsAppCc, waTemplateRateCc } from './campaignCost'

describe('campaignCost', () => {
  it('rates WhatsApp categories and meters only platform WA / managed email', () => {
    expect(waTemplateRateCc('MARKETING')).toEqual({ rate: 1, label: 'Marketing' })
    expect(waTemplateRateCc('utility').rate).toBe(0.3)
    expect(metersWhatsAppCc('platform')).toBe(true)
    expect(metersWhatsAppCc('self_pay')).toBe(false)
    expect(metersEmailCc('CONVOSYNC_MANAGED')).toBe(true)
    expect(metersEmailCc('RESEND')).toBe(false)
  })

  it('estimates cost when metering applies', () => {
    expect(
      estimateCampaignCostCc({
        channel: 'whatsapp',
        audienceCount: 10,
        waCategory: 'MARKETING',
        waPaymentMode: 'platform',
      })
    ).toEqual({ show: true, cc: 10, rateLabel: '1 CC / conversation · Marketing' })

    expect(
      estimateCampaignCostCc({
        channel: 'whatsapp',
        audienceCount: 10,
        waCategory: 'MARKETING',
        waPaymentMode: 'self_pay',
      }).show
    ).toBe(false)

    expect(estimateCampaignCostCc({ channel: 'email', audienceCount: 3, emailDefaultProvider: null }).cc).toBe(3)
    expect(estimateCampaignCostCc({ channel: 'instagram', audienceCount: 100 }).cc).toBe(1)
    expect(formatCc(1.3)).toBe('1.30 CC')
  })
})
