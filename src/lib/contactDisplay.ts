export const LIST_TAGS = { unsubscribe: 'Unsubscribed', blocklist: 'Blocked' } as const

export const IG_PROFILE_FIELD_KEYS = new Set([
  'instagramBio',
  'instagramFollowerCount',
  'instagramFollowsCount',
  'instagramMediaCount',
  'instagramVerified',
  'instagramFollowsBusiness',
  'instagramBusinessFollowsUser',
])

/** "sourceUrl" -> "Source url" — best-effort label for an arbitrary customFields key. */
export function labelForCustomFieldKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ')
  const lower = spaced.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function formatCustomFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export function listLabelForContact(tags: string[]): string {
  if (tags.includes(LIST_TAGS.blocklist)) return 'Blocklist'
  if (tags.includes(LIST_TAGS.unsubscribe)) return 'Unsubscribe'
  return 'All'
}

export function isYesFlag(value: unknown): boolean {
  return value === true || value === 'yes' || value === 'true'
}

export function isNoFlag(value: unknown): boolean {
  return value === false || value === 'no' || value === 'false'
}

export function visibleCustomFieldEntries(
  fields: Record<string, unknown> | null | undefined
): [string, unknown][] {
  return Object.entries(fields ?? {}).filter(
    ([key, value]) => !IG_PROFILE_FIELD_KEYS.has(key) && value !== null && value !== undefined && value !== ''
  )
}
