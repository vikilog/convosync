export function messageDeliveryError(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined
  const m = metadata as Record<string, unknown>
  const statusErrors = Array.isArray(m.whatsappStatusErrors)
    ? (m.whatsappStatusErrors as Array<Record<string, unknown>>)
    : []
  const firstErr = statusErrors[0]
  const webhookError = firstErr
    ? [firstErr.title || firstErr.message, firstErr.code != null ? `(${firstErr.code})` : null]
        .filter(Boolean)
        .join(' ') || undefined
    : undefined
  const sendError = typeof m.sendError === 'string' && m.sendError ? m.sendError : undefined
  return webhookError || sendError
}

export function messageClicked(metadata: unknown, overlay?: boolean): boolean {
  if (overlay) return true
  if (!metadata || typeof metadata !== 'object') return false
  return (metadata as Record<string, unknown>).clicked === true
}

export function messageEmailFields(metadata: unknown): { subject?: string; html?: string } {
  if (!metadata || typeof metadata !== 'object') return {}
  const m = metadata as Record<string, unknown>
  return {
    subject: typeof m.subject === 'string' && m.subject ? m.subject : undefined,
    html: typeof m.html === 'string' && m.html.trim() ? m.html : undefined,
  }
}

export function emailBodyText(content: string, subject?: string): string {
  if (!subject) return content
  const body = content.trim()
  if (!body || body === subject.trim()) return ''
  if (body.startsWith(`${subject.trim()}\n\n`)) return body.slice(subject.trim().length + 2).trim()
  return body
}

export function isOptimisticMessageId(id: string): boolean {
  return id.startsWith('pending-')
}
