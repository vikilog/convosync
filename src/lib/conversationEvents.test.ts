import { describe, expect, it } from 'vitest'

import { conversationEventLabel, mergeMessagesAndEvents } from './conversationEvents'

describe('conversationEventLabel', () => {
  it('names takeover and AI events', () => {
    expect(
      conversationEventLabel({
        id: '1',
        type: 'HUMAN_TAKEOVER',
        actorType: 'HUMAN',
        actorName: 'Vikas',
        createdAt: '2026-09-08T10:00:00Z',
      })
    ).toBe('Vikas took over this chat')
    expect(
      conversationEventLabel({
        id: '2',
        type: 'AI_ASSIGNED',
        actorType: 'AI_AGENT',
        createdAt: '2026-09-08T10:00:00Z',
      })
    ).toBe('AI Agent assigned')
  })
})

describe('mergeMessagesAndEvents', () => {
  it('interleaves by createdAt', () => {
    const merged = mergeMessagesAndEvents(
      [{ createdAt: '2026-09-08T10:02:00Z', id: 'm1' }],
      [
        {
          id: 'e1',
          type: 'HUMAN_TAKEOVER',
          actorType: 'HUMAN',
          createdAt: '2026-09-08T10:01:00Z',
        },
      ]
    )
    expect(merged.map((item) => item.kind)).toEqual(['event', 'message'])
  })
})
