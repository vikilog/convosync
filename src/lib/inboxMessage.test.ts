import { describe, expect, it } from 'vitest'

import { emailBodyText, isOptimisticMessageId, messageClicked, messageDeliveryError } from './inboxMessage'

describe('inboxMessage', () => {
  it('reads deliveryError and clicked from metadata', () => {
    expect(messageDeliveryError({ sendError: 'Rejected by Meta' })).toBe('Rejected by Meta')
    expect(
      messageDeliveryError({
        whatsappStatusErrors: [{ title: 'Undeliverable', code: 131026 }],
      })
    ).toBe('Undeliverable (131026)')
    expect(messageClicked({ clicked: true })).toBe(true)
    expect(emailBodyText('Subj\n\nBody', 'Subj')).toBe('Body')
    expect(isOptimisticMessageId('pending-1')).toBe(true)
  })
})
