import { describe, expect, it } from 'vitest'

import { applyMessageStatus, isDeletedMessage, messageMediaFromMetadata } from './messageMedia'

describe('messageMediaFromMetadata', () => {
  it('reads storageKey and location', () => {
    expect(messageMediaFromMetadata({ storageKey: 'abc', mimeType: 'image/jpeg' })?.storageKey).toBe(
      'abc'
    )
    expect(messageMediaFromMetadata({ latitude: 19.1, longitude: 72.8 })?.latitude).toBe(19.1)
    expect(messageMediaFromMetadata({ foo: 1 })).toBeUndefined()
  })
})

describe('isDeletedMessage', () => {
  it('detects revoked metadata and WhatsApp copy', () => {
    expect(isDeletedMessage({ content: 'hi', metadata: { revoked: true } })).toBe(true)
    expect(isDeletedMessage({ content: 'This message was deleted', metadata: null })).toBe(true)
    expect(isDeletedMessage({ content: 'hi', metadata: null })).toBe(false)
  })
})

describe('applyMessageStatus', () => {
  it('marks earlier agent messages read', () => {
    const next = applyMessageStatus(
      [
        { id: '1', sender: 'agent', status: 'delivered', createdAt: '2026-09-08T10:00:00Z' },
        { id: '2', sender: 'agent', status: 'sent', createdAt: '2026-09-08T10:01:00Z' },
        { id: '3', sender: 'contact', status: 'sent', createdAt: '2026-09-08T10:02:00Z' },
      ],
      { messageId: '2', status: 'read' }
    )
    expect(next.map((m) => m.status)).toEqual(['read', 'read', 'sent'])
  })

  it('keeps clicked and deliveryError on the matching message', () => {
    const next = applyMessageStatus(
      [{ id: '1', sender: 'agent', status: 'sent', createdAt: '2026-09-08T10:00:00Z' }],
      { messageId: '1', status: 'failed', clicked: true, deliveryError: 'Rejected' }
    )
    expect(next[0]).toMatchObject({ status: 'failed', clicked: true, deliveryError: 'Rejected' })
  })
})
