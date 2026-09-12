import { describe, expect, it } from 'vitest'

import { emailHtmlFragment, sanitizeEmailHtml, stripHtmlToText } from './sanitizeEmailHtml'

describe('sanitizeEmailHtml', () => {
  it('strips script tags and javascript urls', () => {
    const html = sanitizeEmailHtml(
      '<p>Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>'
    )
    expect(html).toContain('Hi')
    expect(html.toLowerCase()).not.toContain('script')
    expect(html.toLowerCase()).not.toContain('javascript:')
  })

  it('unwraps a full document body and strips tags to text', () => {
    expect(emailHtmlFragment('<html><body><p>Hello</p></body></html>')).toBe('<p>Hello</p>')
    expect(stripHtmlToText('<p>Hello <b>world</b></p>')).toBe('Hello world')
  })
})
