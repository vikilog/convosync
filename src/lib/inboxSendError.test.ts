import { describe, expect, it } from 'vitest'

import { friendlySendError } from './inboxSendError'

describe('friendlySendError', () => {
  it('maps Meta 24h window errors to a simple explanation', () => {
    const result = friendlySendError(
      new Error('Meta blocked this Instagram reply (outside messaging window / #2534022). HUMAN_AGENT')
    )
    expect(result.title).toBe('Message not delivered')
    expect(result.description).toContain('24-hour reply window')
    expect(result.description.toLowerCase()).not.toContain('human_agent')
  })

  it('falls back to a generic user-facing line', () => {
    expect(friendlySendError(new Error('weird graph dump')).description).toBe(
      'The message could not be sent. Please try again.'
    )
  })
})
