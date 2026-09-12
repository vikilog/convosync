import { describe, expect, it } from 'vitest'

import { isFacebookMessageOrigin, parseEmbeddedSignupMessage } from './whatsappEmbeddedSignup'

function message(origin: string, data: unknown): MessageEvent {
  return { origin, data } as MessageEvent
}

describe('whatsappEmbeddedSignup', () => {
  it('accepts Facebook origins only', () => {
    expect(isFacebookMessageOrigin('https://www.facebook.com')).toBe(true)
    expect(isFacebookMessageOrigin('https://web.facebook.com')).toBe(true)
    expect(isFacebookMessageOrigin('https://evil.example')).toBe(false)
  })

  it('parses finish and cancel events', () => {
    expect(
      parseEmbeddedSignupMessage(
        message('https://www.facebook.com', {
          type: 'WA_EMBEDDED_SIGNUP',
          event: 'FINISH',
          data: { waba_id: 'w1', phone_number_id: 'p1', business_id: 'b1' },
        })
      )
    ).toEqual({
      kind: 'session',
      session: { wabaId: 'w1', phoneNumberId: 'p1', businessId: 'b1' },
    })

    expect(
      parseEmbeddedSignupMessage(
        message('https://www.facebook.com', { type: 'WA_EMBEDDED_SIGNUP', event: 'CANCEL', data: {} })
      )
    ).toEqual({ kind: 'fail', message: 'User cancelled the signup flow' })

    expect(parseEmbeddedSignupMessage(message('https://evil.example', { type: 'WA_EMBEDDED_SIGNUP' }))).toBeNull()
  })
})
