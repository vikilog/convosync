const COUNTRY_TIMEZONES: Record<string, { tz: string; name: string }> = {
  in: { tz: 'Asia/Kolkata', name: 'India' },
  us: { tz: 'America/New_York', name: 'United States (Eastern)' },
  uk: { tz: 'Europe/London', name: 'United Kingdom' },
  es: { tz: 'Europe/Madrid', name: 'Spain' },
  it: { tz: 'Europe/Rome', name: 'Italy' },
  de: { tz: 'Europe/Berlin', name: 'Germany' },
  nl: { tz: 'Europe/Amsterdam', name: 'Netherlands' },
  fr: { tz: 'Europe/Paris', name: 'France' },
  ae: { tz: 'Asia/Dubai', name: 'UAE' },
  au: { tz: 'Australia/Sydney', name: 'Australia (Eastern)' },
  sg: { tz: 'Asia/Singapore', name: 'Singapore' },
  pl: { tz: 'Europe/Warsaw', name: 'Poland' },
  br: { tz: 'America/Sao_Paulo', name: 'Brazil' },
}

export function audienceCountryFromSegmentIds(
  segmentIds: string[]
): { tz: string; name: string; code: string } | null {
  for (const id of segmentIds) {
    const code = id.startsWith('tag:') ? id.slice(4).trim().toLowerCase() : ''
    const match = COUNTRY_TIMEZONES[code]
    if (match) return { ...match, code }
  }
  return null
}

export function formatZonedTime(date: Date, tz: string): string {
  try {
    return date.toLocaleString(undefined, {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return date.toLocaleString()
  }
}

export function formatZonedOffset(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(
      new Date()
    )
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

export function browserTimeZoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  } catch {
    return ''
  }
}
