import { describe, expect, it } from 'vitest'

import {
  applyCannedVariables,
  countBodyVariables,
  formatMessagingWindowRemaining,
  lastInboundAtFromMessages,
  messagingWindowFromLastInbound,
} from './messagingWindow'

const NOW = Date.parse('2026-08-10T12:00:00.000Z')
const H = 60 * 60 * 1000

describe('messagingWindowFromLastInbound', () => {
  it('returns null when there is no inbound', () => {
    expect(messagingWindowFromLastInbound(null, NOW)).toBeNull()
    expect(messagingWindowFromLastInbound('', NOW)).toBeNull()
  })

  it('is open inside 24 hours and closed after', () => {
    const open = messagingWindowFromLastInbound(new Date(NOW - 2 * H).toISOString(), NOW)
    expect(open?.open).toBe(true)

    const closed = messagingWindowFromLastInbound(new Date(NOW - 25 * H).toISOString(), NOW)
    expect(closed?.open).toBe(false)
  })
})

describe('formatMessagingWindowRemaining', () => {
  it('formats remaining time', () => {
    expect(formatMessagingWindowRemaining(0)).toBe('Expired')
    expect(formatMessagingWindowRemaining(3 * H + 12 * 60 * 1000)).toBe('3h 12m left')
  })
})

describe('helpers', () => {
  it('finds the latest contact message', () => {
    expect(
      lastInboundAtFromMessages([
        { sender: 'agent', createdAt: '2026-01-01T00:00:00.000Z' },
        { sender: 'contact', createdAt: '2026-01-01T01:00:00.000Z' },
        { sender: 'agent', createdAt: '2026-01-01T02:00:00.000Z' },
      ])
    ).toBe('2026-01-01T01:00:00.000Z')
  })

  it('counts template body variables', () => {
    expect(countBodyVariables('Hi {{1}}, your code is {{2}}')).toBe(2)
  })

  it('fills canned response placeholders', () => {
    expect(applyCannedVariables('Hi {{contact.name}}', { 'contact.name': 'Vikas' })).toBe('Hi Vikas')
  })
})
