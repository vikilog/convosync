import { describe, expect, it } from 'vitest'

import { dateKeyForMessage, formatDateDivider, groupMessagesByDate } from './inboxTime'

const NOW = new Date('2026-09-08T18:00:00')

describe('formatDateDivider', () => {
  it('labels today, yesterday, and older dates', () => {
    expect(formatDateDivider('2026-09-08T10:00:00', NOW)).toBe('Today')
    expect(formatDateDivider('2026-09-07T22:00:00', NOW)).toBe('Yesterday')
    expect(formatDateDivider('2026-03-12T08:00:00', NOW)).toMatch(/March 12|12 March/)
  })
})

describe('groupMessagesByDate', () => {
  it('splits a flat list into date groups', () => {
    const groups = groupMessagesByDate(
      [
        { createdAt: '2026-09-07T11:00:00' },
        { createdAt: '2026-09-07T12:00:00' },
        { createdAt: '2026-09-08T09:00:00' },
      ],
      NOW
    )
    expect(groups.map((g) => g.dateKey)).toEqual([
      dateKeyForMessage('2026-09-07T11:00:00'),
      dateKeyForMessage('2026-09-08T09:00:00'),
    ])
    expect(groups[0].label).toBe('Yesterday')
    expect(groups[0].messages).toHaveLength(2)
    expect(groups[1].label).toBe('Today')
  })
})
