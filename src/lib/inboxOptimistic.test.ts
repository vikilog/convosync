import { describe, expect, it } from 'vitest'

import { pendingAgentMessage } from './inboxOptimistic'

describe('pendingAgentMessage', () => {
  it('builds a sending agent bubble', () => {
    const msg = pendingAgentMessage({
      pendingId: 'pending-1',
      conversationId: 'c1',
      senderName: 'Ada',
      content: 'Hi',
      type: 'text',
      metadata: null,
    })
    expect(msg).toMatchObject({
      id: 'pending-1',
      sender: 'agent',
      status: 'sending',
      content: 'Hi',
    })
  })
})
