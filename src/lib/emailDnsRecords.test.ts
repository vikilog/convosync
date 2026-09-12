import { describe, expect, it } from 'vitest'

import { parseEmailDnsRecords } from '@/services/realIntegrations.service'

describe('parseEmailDnsRecords', () => {
  it('keeps typed SPF/DKIM/DMARC rows and drops junk', () => {
    expect(
      parseEmailDnsRecords([
        { type: 'SPF', name: '@', value: 'v=spf1 include:amazonses.com ~all', status: 'pending' },
        { type: 'DKIM', name: 'resend._domainkey', value: 'p=abc', status: 'verified' },
        { type: 'DMARC', name: '_dmarc', value: 'v=DMARC1; p=none' },
        { name: 'missing-value' },
        'nope',
      ])
    ).toEqual([
      { type: 'SPF', name: '@', value: 'v=spf1 include:amazonses.com ~all', status: 'pending' },
      { type: 'DKIM', name: 'resend._domainkey', value: 'p=abc', status: 'verified' },
      { type: 'DMARC', name: '_dmarc', value: 'v=DMARC1; p=none' },
    ])
  })

  it('returns empty for non-arrays', () => {
    expect(parseEmailDnsRecords(null)).toEqual([])
    expect(parseEmailDnsRecords({ type: 'SPF' })).toEqual([])
  })
})
