import { describe, expect, it } from 'vitest'

import { stripIllegalHtmlWhitespace } from './stripIllegalHtmlWhitespace'

function whitespaceTextChildOf(html: string, tag: string): boolean {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  for (const el of doc.querySelectorAll(tag)) {
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && /^\s+$/.test(child.textContent ?? '')) return true
    }
  }
  return false
}

describe('stripIllegalHtmlWhitespace', () => {
  it('does not leave whitespace text as a tr child', () => {
    const input = `<table>\n  <tbody>\n    <tr>\n              <td>Hello</td>\n            </tr>\n  </tbody>\n</table>`
    const out = stripIllegalHtmlWhitespace(input)
    expect(out).not.toMatch(/<tr\b[^>]*>\s+/i)
    expect(out).not.toMatch(/<\/td>\s+<\/tr>/i)
    expect(whitespaceTextChildOf(out, 'tr')).toBe(false)
    expect(whitespaceTextChildOf(out, 'tbody')).toBe(false)
    expect(whitespaceTextChildOf(out, 'table')).toBe(false)
    expect(out).toContain('<td>Hello</td>')
  })

  it('keeps normal text inside td', () => {
    const input = `<tr>\n              <td>Keep this text</td>\n            </tr>`
    const out = stripIllegalHtmlWhitespace(input)
    expect(out).toContain('Keep this text')
    expect(out).toBe('<tr><td>Keep this text</td></tr>')
  })

  it('keeps newlines that are real td content, not tr children', () => {
    const input = `<tr><td>line1\nline2</td></tr>`
    expect(stripIllegalHtmlWhitespace(input)).toBe(input)
  })

  it('strips whitespace between sibling cells', () => {
    const out = stripIllegalHtmlWhitespace(`<tr>\n  <td>a</td>\n  <td>b</td>\n</tr>`)
    expect(out).toBe('<tr><td>a</td><td>b</td></tr>')
  })

  it('does not leave whitespace text as a head child', () => {
    const input = `<head>\n    <meta charset="utf-8">\n    <title>  Hello  </title>\n</head>`
    const out = stripIllegalHtmlWhitespace(input)
    expect(out).not.toMatch(/<head\b[^>]*>\s+/i)
    expect(whitespaceTextChildOf(out, 'head')).toBe(false)
    expect(out).toContain('<title>  Hello  </title>')
  })

  it('keeps inner text in title and td', () => {
    expect(stripIllegalHtmlWhitespace('<title>  Hello  </title>')).toBe('<title>  Hello  </title>')
    expect(stripIllegalHtmlWhitespace('<td>  Hello  </td>')).toBe('<td>  Hello  </td>')
  })

  it('does not leave whitespace text as an html child', () => {
    const input = `<html>\n  <head>\n    <title>x</title>\n  </head>\n  <body>\n    <p>Hi</p>\n  </body>\n</html>`
    const out = stripIllegalHtmlWhitespace(input)
    expect(out).not.toMatch(/<html\b[^>]*>\s+/i)
    expect(out).not.toMatch(/<\/head>\s+<body/i)
    expect(whitespaceTextChildOf(out, 'html')).toBe(false)
    expect(whitespaceTextChildOf(out, 'head')).toBe(false)
    expect(out).toContain('<p>Hi</p>')
    expect(out).toContain('<title>x</title>')
  })

  it('strips colgroup whitespace', () => {
    const out = stripIllegalHtmlWhitespace(`<colgroup>\n  <col>\n  <col>\n</colgroup>`)
    expect(out).toBe('<colgroup><col><col></colgroup>')
    expect(whitespaceTextChildOf(out, 'colgroup')).toBe(false)
  })

  it('keeps style and p inner text including whitespace', () => {
    const input = `<head>\n<style>\n  body { margin: 0; }\n</style>\n</head><p>  Hello  </p>`
    const out = stripIllegalHtmlWhitespace(input)
    expect(out).toContain('\n  body { margin: 0; }\n')
    expect(out).toContain('<p>  Hello  </p>')
    expect(whitespaceTextChildOf(out, 'head')).toBe(false)
  })

  it('strips whitespace around comments in head', () => {
    const input = `<head>\n    <title></title>\n    <!--[if !mso]><!-->\n    <meta http-equiv="X-UA-Compatible" content="IE=edge">\n    <!--<![endif]-->\n</head>`
    const out = stripIllegalHtmlWhitespace(input)
    expect(whitespaceTextChildOf(out, 'head')).toBe(false)
    expect(out).toContain('<!--[if !mso]><!-->')
    expect(out).toContain('<!--<![endif]-->')
  })
})
