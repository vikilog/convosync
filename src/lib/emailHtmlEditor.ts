export const EMAIL_SNIPPETS: { id: string; label: string; html: string }[] = [
  { id: 'heading', label: 'Heading', html: '<h2>Hello {{first_name}},</h2>\n' },
  { id: 'paragraph', label: 'Paragraph', html: '<p>Thanks for choosing {{company_name}}.</p>\n' },
  { id: 'button', label: 'Button', html: '<p><a href="{{cta_url}}">Get started</a></p>\n' },
  { id: 'spacer', label: 'Spacer', html: '<p>&nbsp;</p>\n' },
]

export const COMMON_EMAIL_VARS = ['first_name', 'company_name', 'cta_url'] as const

export function extractEmailVars(...parts: string[]): string[] {
  const found = new Set<string>()
  for (const part of parts) {
    for (const m of part.matchAll(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g)) {
      if (m[1]) found.add(m[1])
    }
  }
  return [...found].sort()
}

export function insertAtCursor(source: string, insert: string, start: number, end = start): string {
  const from = Math.max(0, Math.min(start, source.length))
  const to = Math.max(from, Math.min(end, source.length))
  return source.slice(0, from) + insert + source.slice(to)
}
