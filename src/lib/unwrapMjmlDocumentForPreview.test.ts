import { describe, expect, it } from 'vitest'

import { wrapHtmlAsPage } from './easyEmailPayload'
import { compileEasyEmailHtml, createDefaultEasyEmailPage } from './easyEmailRender'
import { mjmlPreviewSourceNodes, unwrapMjmlDocumentForPreview } from './unwrapMjmlDocumentForPreview'

const MJML_LIKE = `<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<title></title>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<style type="text/css">
#outlook a { padding: 0; }
.body-table { width: 100%; }
</style>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body>
<!--[if mso]><i>vml-keep</i><![endif]-->
<div class="email-block node-type-page" data-selector="0-1-0">Hello canvas</div>
</body>
</html>`

describe('unwrapMjmlDocumentForPreview', () => {
  it('drops html/head/body/meta from the preview fragment and keeps style + body markup', () => {
    const fragment = unwrapMjmlDocumentForPreview(MJML_LIKE)
    expect(fragment).not.toMatch(/<html\b/i)
    expect(fragment).not.toMatch(/<head\b/i)
    expect(fragment).not.toMatch(/<body\b/i)
    expect(fragment).not.toMatch(/<meta\b/i)
    expect(fragment).not.toMatch(/<title\b/i)
    expect(fragment).toContain('#outlook a { padding: 0; }')
    expect(fragment).toContain('.body-table { width: 100%; }')
    expect(fragment).toContain('data-selector="0-1-0"')
    expect(fragment).toContain('Hello canvas')
    expect(fragment).toContain('vml-keep')
    expect(fragment).not.toContain('OfficeDocumentSettings')
  })

  it('selects style + body children as preview source nodes, never document hosts', () => {
    const doc = new DOMParser().parseFromString(MJML_LIKE, 'text/html')
    const tags = mjmlPreviewSourceNodes(doc)
      .filter((node): node is Element => node.nodeType === Node.ELEMENT_NODE)
      .map((el) => el.tagName.toLowerCase())
    expect(tags).toContain('style')
    expect(tags).toContain('div')
    expect(tags).not.toContain('html')
    expect(tags).not.toContain('head')
    expect(tags).not.toContain('body')
    expect(tags).not.toContain('meta')
    expect(tags).not.toContain('title')
  })

  it('does not unwrap the save/compile payload', () => {
    const html = compileEasyEmailHtml(createDefaultEasyEmailPage())
    expect(html).toContain('<html')
    expect(html).toContain('Hello')
    const raw = compileEasyEmailHtml(wrapHtmlAsPage('<p>Hi {{first_name}}</p>'))
    expect(raw).toContain('Hi {{first_name}}')
  })
})
