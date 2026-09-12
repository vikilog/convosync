import { describe, expect, it } from 'vitest'

import { mapCampaignDetailFromApi, mapCampaignFromApi, segmentIdsFromFilter } from './campaignMappers'

describe('campaignMappers', () => {
  it('maps list rows and resolves tag filters', () => {
    const c = mapCampaignFromApi({
      id: '1',
      name: 'Promo',
      status: 'Scheduled',
      totalRecipients: 3,
      sentCount: 0,
      audienceType: 'segment',
      audienceFilter: { channel: 'email', segmentIds: ['tag:vip'] },
      createdAt: '2026-01-01T00:00:00Z',
    })
    expect(c.status).toBe('scheduled')
    expect(c.channel).toBe('email')
    expect(c.segmentLabel).toBe('Tag: vip')
    expect(segmentIdsFromFilter({ tag: 'hot' })).toEqual(['tag:hot'])
  })

  it('maps detail recipients and analytics', () => {
    const d = mapCampaignDetailFromApi({
      campaign: {
        id: 'c1',
        name: 'Fail',
        status: 'failed',
        audienceType: 'all',
        audienceFilter: { channel: 'whatsapp', tagMatchMode: 'all', replyHandling: 'journey' },
      },
      channel: 'whatsapp',
      segmentLabel: 'All contacts',
      insights: { sent: 2, delivered: 1, failed: 1, successRate: 50 },
      analytics: {
        successRate: 50,
        failureRate: 50,
        funnel: [{ key: 'sent', label: 'Sent', count: 2, pct: 100 }],
        completion: {},
        deliveryTrend: [],
        lag: { available: false, sendToDelivered: {}, deliveredToRead: {} },
        failureReasons: [{ reason: 'timeout', count: 1, pct: 100 }],
      },
      recipients: [
        {
          messageId: 'm1',
          contactId: 'x',
          contactName: 'A',
          phone: '+1',
          status: 'failed',
          sentAt: '2026-01-01T00:00:00Z',
        },
      ],
      template: { id: 't1', name: 'hello', status: 'approved' },
    })
    expect(d.campaign.status).toBe('failed')
    expect(d.insights.failed).toBe(1)
    expect(d.analytics?.failureReasons[0]?.reason).toBe('timeout')
    expect(d.recipients).toHaveLength(1)
    expect(d.replyHandling).toBe('journey')
    expect(d.tagMatchMode).toBe('all')
  })
})
