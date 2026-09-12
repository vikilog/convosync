import { describe, expect, it } from 'vitest'

import { SETTINGS_NAV, SETTINGS_SECTION_SUBTITLE, isSettingsSection } from './settingsNav'

describe('settingsNav', () => {
  it('exposes real canned-response and ai-provider sections', () => {
    const ids = SETTINGS_NAV.flatMap((g) => g.items.map((i) => i.id))
    expect(ids).toContain('canned-response')
    expect(ids).toContain('ai-provider')
    expect(isSettingsSection('canned-response')).toBe(true)
    expect(isSettingsSection('ai-provider')).toBe(true)
    expect(isSettingsSection('holidays')).toBe(false)
    expect(SETTINGS_SECTION_SUBTITLE['canned-response']).toMatch(/Inbox/)
    expect(SETTINGS_SECTION_SUBTITLE['ai-provider']).toMatch(/provider/)
  })
})
