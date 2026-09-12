import { describe, expect, it } from 'vitest'

import { campaignStatusClass, formatCallDuration, toggleInSet } from './contactDetailFormat'

describe('contactDetailFormat', () => {
  it('formats call duration as m:ss', () => {
    expect(formatCallDuration(0)).toBe('0:00')
    expect(formatCallDuration(65)).toBe('1:05')
  })

  it('maps campaign status tones', () => {
    expect(campaignStatusClass('delivered')).toContain('emerald')
    expect(campaignStatusClass('failed')).toContain('red')
    expect(campaignStatusClass('queued')).toContain('amber')
    expect(campaignStatusClass('unknown')).toBe('')
  })

  it('toggles set membership', () => {
    const next = toggleInSet(new Set(['a']), 'b')
    expect([...next].sort()).toEqual(['a', 'b'])
    expect(toggleInSet(next, 'a').has('a')).toBe(false)
  })
})
