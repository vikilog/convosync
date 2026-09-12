export function campaignStatusClass(status?: string): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'clicked' || s === 'opened' || s === 'delivered') return 'bg-emerald-50 text-emerald-800'
  if (s === 'failed' || s === 'bounced') return 'bg-red-50 text-red-700'
  if (s === 'queued') return 'bg-amber-50 text-amber-800'
  return ''
}

export const INTENT_CLASS: Record<string, string> = {
  interested: 'bg-emerald-50 text-emerald-800',
  question: 'bg-sky-50 text-sky-800',
  complaint: 'bg-red-50 text-red-700',
  unclear: 'bg-amber-50 text-amber-800',
  spam: 'bg-muted text-muted-foreground',
}

export function formatDetailDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  return next
}

export function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
