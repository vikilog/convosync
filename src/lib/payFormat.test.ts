import { describe, expect, it } from 'vitest'

import {
  buildPaymentTemplateVariables,
  buildPlainPaymentPreview,
  formatPayAmount,
  formatPayDate,
  inferBillingPeriod,
} from './payFormat'

describe('payFormat', () => {
  it('formats INR from paise', () => {
    expect(formatPayAmount(249900)).toBe('₹2,499')
  })

  it('infers billing period from the description', () => {
    expect(inferBillingPeriod('Growth plan')).toBe('Monthly')
    expect(inferBillingPeriod('Growth plan · yearly')).toBe('Annual')
    expect(inferBillingPeriod('Annual retainer')).toBe('Annual')
    expect(inferBillingPeriod('monthly seat')).toBe('Monthly')
  })

  it('fills template variables in contact / period / amount order', () => {
    expect(buildPaymentTemplateVariables('Ada', 'yearly plan', 2499)).toEqual([
      'Ada',
      'Annual',
      '₹2,499',
    ])
  })

  it('builds the plain WhatsApp copy', () => {
    expect(buildPlainPaymentPreview('Ada', 'Growth plan', 99)).toBe(
      'Hi Ada, please complete your payment of ₹99 for Growth plan. Tap below to pay securely via UPI or card.'
    )
  })

  it('renders a dash for missing dates', () => {
    expect(formatPayDate(null)).toBe('—')
  })
})
