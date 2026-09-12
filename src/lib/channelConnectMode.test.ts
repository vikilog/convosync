import { describe, expect, it } from 'vitest'

import { instagramShowsConnect, messengerStandaloneMode } from './channelConnectMode'

describe('instagramShowsConnect', () => {
  it('shows connect when empty or when a token needs repair', () => {
    expect(instagramShowsConnect([])).toBe(true)
    expect(instagramShowsConnect(['connected'])).toBe(false)
    expect(instagramShowsConnect(['connected', 'expired'])).toBe(true)
    expect(instagramShowsConnect(['revoked'])).toBe(true)
  })
})

describe('messengerStandaloneMode', () => {
  it('requires Instagram before enable, then treats any page as connected', () => {
    expect(messengerStandaloneMode(false, 0)).toBe('need-instagram')
    expect(messengerStandaloneMode(true, 0)).toBe('enable')
    expect(messengerStandaloneMode(true, 1)).toBe('connected')
    expect(messengerStandaloneMode(false, 2)).toBe('connected')
  })
})
