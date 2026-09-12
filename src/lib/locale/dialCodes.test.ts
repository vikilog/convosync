import { describe, expect, it } from 'vitest'

import { dialForCountry, isValidContactPhone, splitPhone, toE164 } from './dialCodes'

describe('dialCodes', () => {
  it('resolves ISO country to dial', () => {
    expect(dialForCountry('IN')).toBe('+91')
    expect(dialForCountry('US')).toBe('+1')
    expect(dialForCountry(null)).toBe('+91')
  })

  it('splits stored phones without double-prefixing', () => {
    expect(splitPhone('919992492168', 'IN')).toEqual({ dial: '+91', national: '9992492168' })
    expect(splitPhone('+919992492168', 'IN')).toEqual({ dial: '+91', national: '9992492168' })
    expect(splitPhone('9992492168', 'IN')).toEqual({ dial: '+91', national: '9992492168' })
    expect(splitPhone('+14155552671', 'US')).toEqual({ dial: '+1', national: '4155552671' })
  })

  it('composes E.164 without doubling the country code', () => {
    expect(toE164('+91', '9992492168')).toBe('+919992492168')
    expect(toE164('+91', '919992492168')).toBe('+919992492168')
    expect(toE164('+1', '4155552671')).toBe('+14155552671')
  })

  it('validates 10–15 digit phones', () => {
    expect(isValidContactPhone('+919992492168')).toBe(true)
    expect(isValidContactPhone('+91 999')).toBe(false)
    expect(isValidContactPhone('1234567890123456')).toBe(false)
  })
})
