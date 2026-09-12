const STRIP_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base'])

/** Strip scripts / event handlers before rendering email HTML in bubbles. */
export function sanitizeEmailHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('*').forEach((el) => {
    if (STRIP_TAGS.has(el.tagName.toLowerCase())) {
      el.remove()
      return
    }
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim()
      if (name.startsWith('on') || /^(javascript:|data:text\/html)/i.test(value)) {
        el.removeAttribute(attr.name)
      }
    }
  })
  return doc.body.innerHTML
}

export function emailHtmlFragment(html: string): string {
  const trimmed = html.trim()
  const body = trimmed.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  return (body?.[1] ?? trimmed).trim()
}

export function stripHtmlToText(html: string): string {
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}
