import { describe, expect, it } from 'vitest'

import { wrapHtmlAsPage } from './easyEmailPayload'
import { compileEasyEmailHtml, createDefaultEasyEmailPage } from './easyEmailRender'

describe('easyEmailRender', () => {
  it('compiles a RAW page so campaigns still get the HTML payload', () => {
    const html = compileEasyEmailHtml(wrapHtmlAsPage('<p>Hi {{first_name}}</p>'))
    expect(html).toContain('Hi {{first_name}}')
  })

  it('builds a default visual page that still includes merge tags', () => {
    const html = compileEasyEmailHtml(createDefaultEasyEmailPage())
    expect(html).toContain('{{first_name}}')
    expect(html).toContain('{{company_name}}')
    expect(html).toContain('{{cta_url}}')
    expect(html).toContain('<html')
  })

  it('does not leave whitespace text as html/head/tr children in compiled HTML', () => {
    const html = compileEasyEmailHtml(createDefaultEasyEmailPage())
    const doc = new DOMParser().parseFromString(html, 'text/html')
    for (const tag of ['html', 'head', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup']) {
      for (const el of doc.querySelectorAll(tag)) {
        for (const child of el.childNodes) {
          const illegal = child.nodeType === Node.TEXT_NODE && /^\s+$/.test(child.textContent ?? '')
          expect(illegal, `${tag} has whitespace text child`).toBe(false)
        }
      }
    }
    expect(html).toContain('Hello')
  })
})
