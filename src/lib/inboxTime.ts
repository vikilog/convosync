export function formatInboxTime(iso: string, nowMs: number = Date.now()): string {
  const diff = Math.max(0, nowMs - new Date(iso).getTime())
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function formatBubbleTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null
  const d = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function dayDiff(from: Date, to: Date): number {
  return Math.floor((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000)
}

export function dateKeyForMessage(date: Date | string): string {
  const d = toDate(date)
  if (!d) return 'unknown'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDateDivider(date: Date | string | null | undefined, now = new Date()): string {
  const d = toDate(date)
  if (!d) return 'Unknown date'
  const diff = dayDiff(d, now)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return d.toLocaleDateString([], { weekday: 'long' })
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: 'long', day: 'numeric' })
  }
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })
}

export function groupMessagesByDate<T extends { createdAt: string }>(
  messages: T[],
  now = new Date()
): Array<{ dateKey: string; label: string; messages: T[] }> {
  const groups = new Map<string, T[]>()
  for (const message of messages) {
    const key = dateKeyForMessage(message.createdAt)
    const bucket = groups.get(key)
    if (bucket) bucket.push(message)
    else groups.set(key, [message])
  }
  return Array.from(groups.entries()).map(([dateKey, bucket]) => ({
    dateKey,
    label: formatDateDivider(bucket[0].createdAt, now),
    messages: bucket,
  }))
}
