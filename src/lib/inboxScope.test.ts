import { describe, expect, it } from 'vitest'

import {
  formatInboxScopeSummary,
  isConversationInInboxScope,
  isInboxChannelAllowed,
  resolveEffectiveInboxScope,
} from './inboxScope'

describe('resolveEffectiveInboxScope', () => {
  it('gives admins the full inbox regardless of stored scope', () => {
    expect(
      resolveEffectiveInboxScope('admin', { mode: 'restricted', channels: ['whatsapp'] })
    ).toEqual({ mode: 'all' })
  })

  it('parses a member restriction', () => {
    const scope = resolveEffectiveInboxScope('agent', {
      mode: 'restricted',
      channels: ['whatsapp', 'email'],
      accounts: { whatsapp: ['pn1'] },
    })
    expect(isInboxChannelAllowed('whatsapp', scope)).toBe(true)
    expect(isInboxChannelAllowed('instagram', scope)).toBe(false)
    expect(isInboxChannelAllowed('email', scope)).toBe(true)
    expect(isConversationInInboxScope({ channel: 'whatsapp', channelAccountId: 'pn1' }, scope)).toBe(
      true
    )
    expect(isConversationInInboxScope({ channel: 'whatsapp', channelAccountId: 'other' }, scope)).toBe(
      false
    )
  })
})

describe('formatInboxScopeSummary', () => {
  it('summarizes restricted channels and account counts', () => {
    expect(formatInboxScopeSummary({ mode: 'all' })).toBe('All inboxes')
    expect(
      formatInboxScopeSummary({
        mode: 'restricted',
        channels: ['whatsapp'],
        accounts: { whatsapp: ['pn1', 'pn2'] },
      })
    ).toBe('WhatsApp (2)')
  })
})
