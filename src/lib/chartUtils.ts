export type ChartPoint = {
  day: string
  sent: number
  delivered: number
  read: number
}

export const MOCK_CHART_DATA: ChartPoint[] = [
  { day: 'Mon', sent: 45, delivered: 42, read: 38 },
  { day: 'Tue', sent: 52, delivered: 48, read: 41 },
  { day: 'Wed', sent: 38, delivered: 35, read: 29 },
  { day: 'Thu', sent: 61, delivered: 58, read: 52 },
  { day: 'Fri', sent: 55, delivered: 51, read: 44 },
  { day: 'Sat', sent: 28, delivered: 26, read: 21 },
  { day: 'Sun', sent: 33, delivered: 30, read: 25 },
]

export function normalizeChartData(rows: ChartPoint[], dayCount = 7): ChartPoint[] {
  if (rows.length === 0) return rows
  return rows.slice(-dayCount)
}

export function isChartEmpty(rows: ChartPoint[]): boolean {
  return rows.every((r) => r.sent === 0 && r.delivered === 0 && r.read === 0)
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  if (hour >= 17 && hour < 21) return 'Good evening'
  return 'Good night'
}

export function getFirstName(fullName: string): string {
  const trimmed = fullName.trim()
  if (!trimmed) return 'there'
  return trimmed.split(/\s+/)[0] ?? trimmed
}

export function formatRelativeTime(fromMs: number, nowMs: number = Date.now()): string {
  const diff = Math.max(0, nowMs - fromMs)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}
