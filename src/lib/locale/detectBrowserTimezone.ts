/** Browser IANA timezone via Intl — empty string when unavailable. */
export function detectBrowserTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return typeof tz === 'string' && tz.includes('/') ? tz : '';
  } catch {
    return '';
  }
}
