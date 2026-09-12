import { describe, expect, it } from 'vitest'

import {
  canDeleteCampaign,
  canResumeCampaign,
  DELETE_SEND_LOCK_MS,
  isFailedCampaignRelaunchable,
  isScheduledCampaignEditable,
  minScheduleTimeFor,
  SCHEDULED_CAMPAIGN_EDIT_LEAD_MS,
  todayLocal,
  wizardSeedFromCampaignDetail,
} from './campaignScheduleEdit'

const now = Date.now()

const baseDetail = {
  channel: 'whatsapp',
  audienceType: 'segment',
  segmentIds: ['tag:vip', 'tag:leads'],
  template: { id: 't1', name: 'hello' },
  variableMappings: { '1': 'first_name' },
  headerMediaStorageKey: 'media/key',
  headerMediaMimeType: 'image/png',
  headerMediaFileName: 'x.png',
  headerMediaAssetId: null,
  name: 'Promo',
  scheduledAt: new Date(now + 3_600_000).toISOString(),
}

describe('campaignScheduleEdit', () => {
  it('gates scheduled edit and failed relaunch', () => {
    expect(
      isScheduledCampaignEditable('scheduled', new Date(now + SCHEDULED_CAMPAIGN_EDIT_LEAD_MS + 1_000), now)
    ).toBe(true)
    expect(
      isScheduledCampaignEditable('scheduled', new Date(now + SCHEDULED_CAMPAIGN_EDIT_LEAD_MS), now)
    ).toBe(false)
    expect(isScheduledCampaignEditable('draft', new Date(now + 60 * 60 * 1000), now)).toBe(false)
    expect(isFailedCampaignRelaunchable('failed')).toBe(true)
    expect(isFailedCampaignRelaunchable('scheduled')).toBe(false)
  })

  it('seeds wizard from scheduled and failed campaigns', () => {
    const seed = wizardSeedFromCampaignDetail(baseDetail)
    expect(seed?.audienceType).toBe('segment')
    expect(seed?.segmentIds).toEqual(['tag:vip', 'tag:leads'])
    expect(seed?.templateId).toBe('t1')
    expect(wizardSeedFromCampaignDetail({ ...baseDetail, scheduledAt: null, segmentIds: [] })).toBeNull()

    const failedSeed = wizardSeedFromCampaignDetail({
      ...baseDetail,
      status: 'failed',
      scheduledAt: null,
      audienceType: 'all',
      segmentIds: [],
      template: { id: 't2', name: 'retry-me' },
      variableMappings: {},
      headerMediaStorageKey: null,
      headerMediaMimeType: null,
      headerMediaFileName: null,
    })
    expect(failedSeed?.scheduledAt).toBeNull()
    expect(failedSeed?.templateId).toBe('t2')
  })

  it('blocks delete near send and resume after the original time', () => {
    expect(canDeleteCampaign('running', null, now)).toBe(false)
    expect(canDeleteCampaign('scheduled', new Date(now + DELETE_SEND_LOCK_MS - 1_000).toISOString(), now)).toBe(
      false
    )
    expect(canDeleteCampaign('scheduled', new Date(now + DELETE_SEND_LOCK_MS + 1_000).toISOString(), now)).toBe(
      true
    )
    expect(canResumeCampaign('cancelled', new Date(now + 60_000).toISOString(), now)).toBe(true)
    expect(canResumeCampaign('cancelled', new Date(now - 60_000).toISOString(), now)).toBe(false)
  })

  it('keeps today selectable late at night', () => {
    const lateNight = new Date(2026, 0, 15, 23, 45).getTime()
    const midday = new Date(2026, 0, 15, 12, 0).getTime()
    expect(todayLocal(lateNight)).toBe('2026-01-15')
    expect(minScheduleTimeFor('2026-01-15', midday)).toBe('12:00')
    expect(minScheduleTimeFor('2026-01-16', midday)).toBeUndefined()
  })
})
