export type ReportsRange = 'today' | '7d' | '30d'

export const REPORTS_RANGE_LABEL: Record<ReportsRange, string> = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
}

export type HourlyDensityBin = { time: string; volume: number; qualified: number }

export const HOURLY_DENSITY: HourlyDensityBin[] = [
  { time: '09:00', volume: 35, qualified: 12 },
  { time: '10:00', volume: 55, qualified: 22 },
  { time: '11:00', volume: 70, qualified: 38 },
  { time: '12:00', volume: 90, qualified: 55 },
  { time: '13:00', volume: 45, qualified: 15 },
  { time: '14:00', volume: 60, qualified: 30 },
  { time: '15:00', volume: 80, qualified: 42 },
  { time: '16:00', volume: 85, qualified: 48 },
  { time: '17:00', volume: 65, qualified: 28 },
  { time: '18:00', volume: 40, qualified: 10 },
]

function hashSeed(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

/** Deterministic CSAT (3.8–5.0) per team member id — consistent across renders. */
export function csatForMember(id: string): number {
  const seed = hashSeed(id)
  return Math.round((3.8 + (seed % 13) / 10) * 10) / 10
}
