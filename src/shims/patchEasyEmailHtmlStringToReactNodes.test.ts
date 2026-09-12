import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

import { patchEasyEmailHtmlStringToReactNodes } from './patchEasyEmailHtmlStringToReactNodes'

const require = createRequire(import.meta.url)

describe('patchEasyEmailHtmlStringToReactNodes', () => {
  it('stops HtmlStringToReactNodes from mounting documentElement on the installed editor', () => {
    const src = readFileSync(require.resolve('easy-email-editor/lib/index.js'), 'utf8')
    const patched = patchEasyEmailHtmlStringToReactNodes(src)
    expect(patched).not.toBe(src)
    expect(patched).toContain('__wabizMjmlPreviewNodes')
    expect(patched).not.toMatch(/node:\s*doc\.documentElement/)
    expect(patched).toContain('type === "html" || type === "head" || type === "body"')
    expect(patchEasyEmailHtmlStringToReactNodes(patched)).toBe(patched)
  })
})
