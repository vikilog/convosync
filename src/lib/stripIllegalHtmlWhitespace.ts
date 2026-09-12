/** Parents HTML forbids whitespace-only text nodes as children (React 19 hydration). */
const STRUCT = new Set(['html', 'head', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup'])
const VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

function tagName(tag: string): string {
  const m = /^<\/?([a-zA-Z][^\s/>]*)/.exec(tag)
  return m ? m[1].toLowerCase() : ''
}

function tagEnd(html: string, start: number): number {
  let quote = ''
  for (let i = start + 1; i < html.length; i++) {
    const c = html[i]
    if (quote) {
      if (c === quote) quote = ''
    } else if (c === '"' || c === "'") quote = c
    else if (c === '>') return i + 1
  }
  return html.length
}

/**
 * Drop whitespace-only text that HTML forbids as a child of html/head/table/thead/tbody/tfoot/tr/colgroup.
 * MJML pretty-prints those newlines; React 19 treats them as a hydration error.
 * Text inside `<title>` / `<style>` / `<td>` / `<th>` / `<p>` is left alone.
 */
export function stripIllegalHtmlWhitespace(html: string): string {
  if (!html) return html
  const stack: string[] = []
  let out = ''
  let i = 0
  while (i < html.length) {
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4)
      const j = end === -1 ? html.length : end + 3
      out += html.slice(i, j)
      i = j
      continue
    }
    if (html[i] === '<') {
      const j = tagEnd(html, i)
      const token = html.slice(i, j)
      out += token
      i = j
      if (token.startsWith('</')) {
        const idx = stack.lastIndexOf(tagName(token))
        if (idx !== -1) stack.length = idx
      } else if (!token.startsWith('<!') && !token.startsWith('<?')) {
        const name = tagName(token)
        if (name && !VOID.has(name) && !/\/\s*>$/.test(token)) stack.push(name)
      }
      continue
    }
    const next = html.indexOf('<', i)
    const j = next === -1 ? html.length : next
    const text = html.slice(i, j)
    i = j
    const parent = stack[stack.length - 1]
    if (parent && STRUCT.has(parent) && /^\s*$/.test(text)) continue
    out += text
  }
  return out
}
