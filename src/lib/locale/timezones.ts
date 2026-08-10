const FALLBACK_TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

export function listTimeZones(): string[] {
  const zones = new Set<string>(FALLBACK_TIMEZONES);
  try {
    const supported = Intl.supportedValuesOf?.('timeZone');
    if (supported?.length) {
      for (const tz of supported) zones.add(tz);
    }
  } catch {
    /* ignore */
  }
  return [...zones].sort((a, b) => a.localeCompare(b));
}

function gmtOffsetLabel(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(date);
    const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    // "GMT+05:30" → "GMT+5:30"; "GMT" stays "GMT"
    return raw.replace(/GMT([+-])0?(\d+):(\d+)/, (_, sign, h, m) => {
      const mins = m === '00' ? '' : `:${m}`;
      return `GMT${sign}${Number(h)}${mins}`;
    });
  } catch {
    return 'GMT';
  }
}

function longZoneName(timeZone: string, date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'long',
    }).formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;
  } catch {
    return timeZone;
  }
}

/** e.g. `(GMT+5:30) Asia/Kolkata — India Standard Time` */
export function formatTimezoneLabel(timeZone: string, date = new Date()): string {
  const offset = gmtOffsetLabel(timeZone, date);
  const name = longZoneName(timeZone, date);
  return `(${offset}) ${timeZone} — ${name}`;
}

export type TimezoneOption = { value: string; label: string };

export function listTimezoneOptions(): TimezoneOption[] {
  const now = new Date();
  return listTimeZones().map((value) => ({
    value,
    label: formatTimezoneLabel(value, now),
  }));
}
