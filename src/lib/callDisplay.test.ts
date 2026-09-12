import { describe, expect, it } from 'vitest'

import { callerInitials, displayCallerNumber, isWhatsAppCaller } from './callDisplay'

describe('callDisplay', () => {
  it('strips WhatsApp SIP glue from a Plivo caller id', () => {
    expect(displayCallerNumber('+913954921186WhatsApp-p1.live.plivo.com')).toBe('+91 3954921186')
    expect(displayCallerNumber('sip:3954921186@WhatsApp-p1.live.plivo.com')).toBe('+91 3954921186')
    expect(isWhatsAppCaller('+913954921186WhatsApp-p1.live.plivo.com')).toBe(true)
    expect(isWhatsAppCaller('+919992492168')).toBe(false)
  })

  it('builds initials from a name, else last two digits', () => {
    expect(callerInitials('Vikas Swami', '+91 99 9249 2168')).toBe('VS')
    expect(callerInitials(null, '+91 3954921186')).toBe('86')
  })
})
