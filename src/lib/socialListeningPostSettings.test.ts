import { describe, expect, it } from 'vitest'

import {
  mapPostAgentSettings,
  POST_AGENT_DEFAULTS,
  postAgentSettingsPayload,
} from './socialListeningPostSettings'

describe('mapPostAgentSettings', () => {
  it('falls back to safe defaults for garbage values', () => {
    expect(mapPostAgentSettings({})).toMatchObject({
      autoResponseEnabled: false,
      interestedMode: 'review',
      spamMode: 'review',
      confidenceThreshold: 80,
    })
    expect(mapPostAgentSettings({ interestedMode: 'explode' }).interestedMode).toBe('review')
  })

  it('keeps known API values', () => {
    const mapped = mapPostAgentSettings({
      autoResponseEnabled: true,
      leadFunnelId: 'fun_1',
      interestedMode: 'auto',
      commentAutomationJourneyId: 'j1',
      autoDmsSentToday: 3,
    })
    expect(mapped.autoResponseEnabled).toBe(true)
    expect(mapped.leadFunnelId).toBe('fun_1')
    expect(mapped.interestedMode).toBe('auto')
    expect(mapped.autoDmsSentToday).toBe(3)
  })
})

describe('postAgentSettingsPayload', () => {
  it('clears working hours and journey when off', () => {
    const payload = postAgentSettingsPayload(
      { ...POST_AGENT_DEFAULTS, workingHoursOnly: false, workingHoursStart: '09:00' },
      '',
    )
    expect(payload.workingHoursStart).toBeNull()
    expect(payload.commentAutomationJourneyId).toBeNull()
  })

  it('keeps journey id and hours when set', () => {
    const payload = postAgentSettingsPayload(
      { ...POST_AGENT_DEFAULTS, workingHoursOnly: true, workingHoursStart: '10:00', workingHoursEnd: '17:00' },
      'ig_j1',
    )
    expect(payload.commentAutomationJourneyId).toBe('ig_j1')
    expect(payload.workingHoursStart).toBe('10:00')
  })
})
