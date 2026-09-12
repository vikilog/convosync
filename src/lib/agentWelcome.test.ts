import { describe, expect, it } from 'vitest'

import { parseIntentFallback } from './agentWelcome'

describe('parseIntentFallback', () => {
  it('keeps known values and defaults the rest to silent', () => {
    expect(parseIntentFallback('automated_response')).toBe('automated_response')
    expect(parseIntentFallback('transfer_human')).toBe('transfer_human')
    expect(parseIntentFallback('silent')).toBe('silent')
    expect(parseIntentFallback('nope')).toBe('silent')
    expect(parseIntentFallback(undefined)).toBe('silent')
  })
})
