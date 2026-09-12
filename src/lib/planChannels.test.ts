import { describe, expect, it } from 'vitest'

import {
  channelAllowedByPlan,
  channelConnectBlockedReason,
  isChannelCountLimitReached,
  pathForCampaign,
  pathForIntegrationsChannel,
  pathForNewCampaign,
  pathForSettingsSection,
  waitingOldestFirst,
} from './planChannels'

describe('planChannels', () => {
  it('gates channels from the plan label', () => {
    expect(channelAllowedByPlan('WhatsApp only', 'whatsapp')).toBe(true)
    expect(channelAllowedByPlan('WhatsApp only', 'instagram')).toBe(false)
    expect(channelAllowedByPlan('WhatsApp, Instagram, Messenger', 'messenger')).toBe(true)
    expect(channelAllowedByPlan('All channels', 'instagram')).toBe(true)
    expect(channelAllowedByPlan('WhatsApp only', 'email')).toBe(true)
    expect(channelAllowedByPlan('WhatsApp only', 'telegram')).toBe(true)
  })

  it('blocks connect when the channel is off-plan or the slot cap is used', () => {
    expect(channelConnectBlockedReason('WhatsApp only', { used: 0, limit: 5, pending: 5 }, 'instagram')).toMatch(
      /Instagram is not on your plan/
    )
    expect(channelConnectBlockedReason('WhatsApp, Instagram', { used: 2, limit: 2, pending: 0 }, 'instagram')).toMatch(
      /Channel limit reached/
    )
    expect(channelConnectBlockedReason('WhatsApp only', { used: 1, limit: 1, pending: 0 }, 'email')).toBeNull()
    expect(isChannelCountLimitReached({ used: 2, limit: 2, pending: 0 })).toBe(true)
    expect(isChannelCountLimitReached({ used: 1, limit: 2_147_483_647, pending: 10 })).toBe(false)
  })

  it('builds existing-route deep links', () => {
    expect(pathForIntegrationsChannel('whatsapp')).toBe('/integrations?channel=whatsapp')
    expect(pathForCampaign('c1')).toBe('/campaigns?id=c1')
    expect(pathForNewCampaign()).toBe('/campaigns?new=1')
    expect(pathForSettingsSection('users')).toBe('/settings?section=users')
    expect(pathForSettingsSection('subscription')).toBe('/settings?section=subscription')
  })

  it('sorts needs-reply oldest waiting first', () => {
    const rows = waitingOldestFirst([
      { unreadCount: 1, lastMessageAt: '2026-09-08T12:00:00.000Z', id: 'new' },
      { unreadCount: 0, lastMessageAt: '2026-09-08T08:00:00.000Z', id: 'read' },
      { unreadCount: 2, lastMessageAt: '2026-09-08T10:00:00.000Z', id: 'old' },
    ])
    expect(rows.map((r) => r.id)).toEqual(['old', 'new'])
  })
})
