import { describe, expect, it } from 'vitest'

import {
  campaignWhenAt,
  compareIsoDates,
  nextCampaignListSort,
  sortCampaignsForList,
  type CampaignListSortable,
} from './campaignListSort'

function stub(partial: Partial<CampaignListSortable> & { id: string }): CampaignListSortable & { id: string } {
  return {
    status: 'draft',
    channel: 'whatsapp',
    createdAt: '2026-01-01T00:00:00Z',
    sentAt: null,
    scheduledAt: null,
    ...partial,
  }
}

describe('campaignListSort', () => {
  it('uses scheduledAt for When when status is scheduled', () => {
    expect(
      campaignWhenAt({ status: 'scheduled', scheduledAt: '2026-01-02T00:00:00Z', sentAt: null })
    ).toBe('2026-01-02T00:00:00Z')
    expect(
      campaignWhenAt({
        status: 'completed',
        scheduledAt: '2026-01-02T00:00:00Z',
        sentAt: '2026-01-03T00:00:00Z',
      })
    ).toBe('2026-01-03T00:00:00Z')
  })

  it('compares ISO dates and toggles sort', () => {
    expect(compareIsoDates('2026-01-01T00:00:00Z', '2026-01-02T00:00:00Z', 'asc')).toBeLessThan(0)
    expect(compareIsoDates(null, '2026-01-01T00:00:00Z', 'desc')).toBe(1)
    expect(nextCampaignListSort('created', 'desc', 'created')).toEqual({ key: 'created', dir: 'asc' })
    expect(nextCampaignListSort('created', 'asc', 'when')).toEqual({ key: 'when', dir: 'desc' })
  })

  it('sorts created / when / status / channel', () => {
    const rows = [
      stub({ id: 'old', createdAt: '2026-01-01T00:00:00Z', sentAt: '2026-01-05T00:00:00Z' }),
      stub({ id: 'new', createdAt: '2026-01-10T00:00:00Z', sentAt: null }),
      stub({
        id: 'sched',
        status: 'scheduled',
        createdAt: '2026-01-05T00:00:00Z',
        scheduledAt: '2026-02-01T00:00:00Z',
      }),
    ]
    expect(sortCampaignsForList(rows, 'created', 'desc').map((c) => c.id)).toEqual(['new', 'sched', 'old'])
    expect(sortCampaignsForList(rows, 'when', 'desc').map((c) => c.id)).toEqual(['sched', 'old', 'new'])

    const statusRows = [
      stub({ id: 'a', status: 'running' }),
      stub({ id: 'b', status: 'draft' }),
      stub({ id: 'c', status: 'completed' }),
    ]
    expect(sortCampaignsForList(statusRows, 'status', 'asc').map((c) => c.id)).toEqual(['c', 'b', 'a'])

    const channelRows = [
      stub({ id: 'x', channel: 'whatsapp' }),
      stub({ id: 'y', channel: 'email' }),
      stub({ id: 'z', channel: 'instagram' }),
    ]
    expect(sortCampaignsForList(channelRows, 'channel', 'asc').map((c) => c.id)).toEqual(['y', 'z', 'x'])
  })
})
