import { describe, expect, it } from 'vitest'

import { buildContactsCsv, defaultExportColumnIds } from './exportContactsCsv'
import type { Contact } from '@/services/realContacts.service'

const sample: Contact = {
  id: 'c1',
  name: 'Alice',
  phone: '+9198',
  email: 'a@x.com',
  avatar: null,
  source: 'web',
  tags: ['Hot', 'Lead'],
  customFields: null,
  journeyStatus: null,
  excludeFromInsights: false,
  automationsPaused: false,
  lastCampaignId: null,
  lastCampaignAt: null,
  workspaceId: 'w1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('buildContactsCsv', () => {
  it('writes selected columns and defuses formulas', () => {
    const csv = buildContactsCsv([sample], ['name', 'phone', 'tags'])
    expect(csv.startsWith('name,phone,tags\n')).toBe(true)
    expect(csv).toContain('"Alice"')
    expect(csv).toContain('"Hot;Lead"')

    const malicious = buildContactsCsv(
      [{ ...sample, name: "=cmd|'/C calc'!A0", tags: ['+HYPERLINK("http://evil.test")'] }],
      ['name', 'tags']
    )
    expect(malicious).toContain('"\'=cmd')
    expect(malicious).toContain('"\'+HYPERLINK')
  })

  it('defaults to all columns', () => {
    expect(defaultExportColumnIds().join(',')).toBe('name,phone,email,source,tags')
  })
})
