import { describe, expect, it } from 'vitest'

import { COMMON_EMAIL_VARS } from './emailHtmlEditor'
import {
  DEFAULT_EMAIL_HTML,
  deserializeEmailTemplatePayload,
  emailMergeTags,
  emailTemplateBuilderPath,
  extractRawHtml,
  mergeTagToken,
  parseStoredDesign,
  serializeEmailTemplatePayload,
  toDesignJson,
  wrapHtmlAsPage,
} from './easyEmailPayload'

describe('easyEmailPayload', () => {
  it('round-trips HTML through a RAW page block', () => {
    const html = '<p>Hello {{first_name}}</p>'
    const page = wrapHtmlAsPage(html)
    expect(page.type).toBe('page')
    expect(page.children[0]?.type).toBe('raw')
    expect(extractRawHtml(page)).toBe(html)
  })

  it('serializes JSON + HTML together and deserializes both', () => {
    const content = wrapHtmlAsPage(DEFAULT_EMAIL_HTML)
    const saved = serializeEmailTemplatePayload({
      content,
      htmlBody: '<p>campaign html</p>',
      htmlEdited: true,
    })
    expect(saved.htmlBody).toBe('<p>campaign html</p>')
    expect(saved.designJson.engine).toBe('easy-email')
    expect(saved.designJson.htmlEdited).toBe(true)

    const loaded = deserializeEmailTemplatePayload(saved.designJson, saved.htmlBody)
    expect(loaded.htmlBody).toBe('<p>campaign html</p>')
    expect(loaded.htmlEdited).toBe(true)
    expect(extractRawHtml(loaded.content)).toBe(DEFAULT_EMAIL_HTML)
  })

  it('wraps legacy HTML when designJson is missing', () => {
    const parsed = parseStoredDesign(null, '<h1>Legacy</h1>')
    expect(parsed.htmlEdited).toBe(false)
    expect(extractRawHtml(parsed.content)).toBe('<h1>Legacy</h1>')
  })

  it('accepts a bare Easy Email page as designJson', () => {
    const page = wrapHtmlAsPage('<p>Bare</p>')
    const parsed = parseStoredDesign(page as unknown as Record<string, unknown>, '')
    expect(extractRawHtml(parsed.content)).toBe('<p>Bare</p>')
  })

  it('keeps visual JSON when HTML was edited separately', () => {
    const content = wrapHtmlAsPage('<p>visual</p>')
    const design = toDesignJson(content, true) as unknown as Record<string, unknown>
    const loaded = deserializeEmailTemplatePayload(design, '<p>hand-edited</p>')
    expect(loaded.htmlBody).toBe('<p>hand-edited</p>')
    expect(extractRawHtml(loaded.content)).toBe('<p>visual</p>')
    expect(loaded.htmlEdited).toBe(true)
  })

  it('maps merge tags to {{name}} tokens used by campaigns', () => {
    const tags = emailMergeTags()
    expect(Object.keys(tags).sort()).toEqual([...COMMON_EMAIL_VARS].sort())
    expect(mergeTagToken('first_name')).toBe('{{first_name}}')
  })

  it('builds builder routes for new and existing templates', () => {
    expect(emailTemplateBuilderPath()).toBe('/templates/email/new/builder')
    expect(emailTemplateBuilderPath('abc 1')).toBe('/templates/email/abc%201/builder')
  })

  it('strips illegal html/head/table whitespace from saved htmlBody', () => {
    const saved = serializeEmailTemplatePayload({
      content: wrapHtmlAsPage(DEFAULT_EMAIL_HTML),
      htmlBody:
        '<html>\n<head>\n<meta charset="utf-8">\n<title>  Hello  </title>\n</head>\n<body><table>\n  <tr>\n              <td>  campaign  </td>\n            </tr>\n</table></body>\n</html>',
      htmlEdited: true,
    })
    expect(saved.htmlBody).not.toMatch(/<head\b[^>]*>\s+/i)
    expect(saved.htmlBody).not.toMatch(/<tr\b[^>]*>\s+/i)
    expect(saved.htmlBody).toContain('<title>  Hello  </title>')
    expect(saved.htmlBody).toContain('<td>  campaign  </td>')
  })
})
