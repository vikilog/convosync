import { describe, expect, it } from 'vitest'

import {
  assertValidTemplateName,
  countBodyVariables,
  headerFormatFromApi,
  headerFormatToApi,
  isUrlLikeName,
} from './templateBuilderUtils'

describe('templateBuilderUtils', () => {
  it('rejects URL-like template names', () => {
    expect(isUrlLikeName('https://example.com')).toBe(true)
    expect(isUrlLikeName('www.example.com')).toBe(true)
    expect(isUrlLikeName('order_confirmation')).toBe(false)
    expect(() => assertValidTemplateName('https://foo.com/bar')).toThrow(/URL/)
    expect(assertValidTemplateName('Order Confirmation')).toBe('order_confirmation')
  })

  it('counts distinct body placeholders, not the max index', () => {
    expect(countBodyVariables('Hi {{1}}, order {{3}}')).toBe(2)
    expect(countBodyVariables('Hi {{1}}, order {{2}}')).toBe(2)
  })

  it('round-trips header formats', () => {
    expect(headerFormatToApi('image')).toBe('IMAGE')
    expect(headerFormatFromApi('IMAGE')).toBe('image')
    expect(headerFormatFromApi(null, true)).toBe('text')
    expect(headerFormatFromApi(null)).toBe('none')
  })
})
