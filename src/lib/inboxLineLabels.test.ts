import { describe, expect, it } from 'vitest'

import { inboxChannelLineLabel, shouldShowWhatsAppLine, windowAccountLabel } from './inboxLineLabels'

const wa = [
  { phoneNumberId: 'pn1', label: 'Sales' },
  { phoneNumberId: 'pn2', label: 'Support' },
]

describe('inboxChannelLineLabel', () => {
  it('resolves a WhatsApp line when multiple accounts exist', () => {
    expect(
      inboxChannelLineLabel({
        channel: 'whatsapp',
        channelAccountId: 'pn2',
        whatsappAccounts: wa,
        instagramAccounts: [],
        messengerAccounts: [],
        telegramAccounts: [],
      })
    ).toBe('Support')
    expect(shouldShowWhatsAppLine(wa)).toBe(true)
  })

  it('adds an IG/Messenger window label only when multiple accounts are connected', () => {
    const ig = [
      { id: 'ig1', matchIds: ['ig1'], label: '@alpha' },
      { id: 'ig2', matchIds: ['ig2'], label: '@beta' },
    ]
    expect(
      windowAccountLabel({ channel: 'instagram', channelAccountId: 'ig2', instagramAccounts: ig, messengerAccounts: [] })
    ).toBe('@beta')
    expect(
      windowAccountLabel({
        channel: 'instagram',
        channelAccountId: 'ig1',
        instagramAccounts: [ig[0]],
        messengerAccounts: [],
      })
    ).toBeNull()
  })
})
