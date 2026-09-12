/** Tags React 19 forbids as descendants of a preview `<div>`. */
const SKIP_HOST = new Set(['META', 'TITLE', 'BASE', 'HTML', 'HEAD', 'BODY'])

/**
 * Nodes Easy Email’s Design canvas may turn into React hosts.
 * Styles from `<head>` are hoisted; `<body>` children are kept (including VML/MSO comments).
 * `<html>` / `<head>` / `<body>` / `<meta>` / `<title>` never appear as hosts.
 */
export function mjmlPreviewSourceNodes(doc: Document): Node[] {
  const styles = [...doc.head.querySelectorAll('style')]
  const bodyKids = [...doc.body.childNodes].filter((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return true
    return !SKIP_HOST.has((node as Element).tagName)
  })
  return [...styles, ...bodyKids]
}

function serializePreviewNode(node: Node): string {
  if (node.nodeType === Node.COMMENT_NODE) return `<!--${(node as Comment).data}-->`
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  if (node.nodeType === Node.ELEMENT_NODE) return (node as Element).outerHTML
  return ''
}

/**
 * Live canvas / React preview only. Saved campaign htmlBody must stay a full email document.
 * Drop document wrappers; hoist `<style>` so MJML CSS still applies.
 */
export function unwrapMjmlDocumentForPreview(html: string): string {
  if (!html) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return mjmlPreviewSourceNodes(doc).map(serializePreviewNode).join('')
}
