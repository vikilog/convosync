export type HeaderFormat = 'none' | 'text' | 'image' | 'video' | 'document'

export type ButtonKind = 'none' | 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'FLOW'

export function headerFormatToApi(format: HeaderFormat): 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null {
  if (format === 'text') return 'TEXT'
  if (format === 'image') return 'IMAGE'
  if (format === 'video') return 'VIDEO'
  if (format === 'document') return 'DOCUMENT'
  return null
}

export function headerFormatFromApi(format?: string | null, hasTextHeader?: boolean): HeaderFormat {
  const f = (format || '').toUpperCase()
  if (f === 'IMAGE') return 'image'
  if (f === 'VIDEO') return 'video'
  if (f === 'DOCUMENT') return 'document'
  if (f === 'TEXT' || hasTextHeader) return 'text'
  return 'none'
}

export function countBodyVariables(body: string): number {
  const found = new Set<number>()
  for (const m of body.matchAll(/\{\{(\d+)\}\}/g)) {
    found.add(parseInt(m[1], 10))
  }
  return found.size
}

export function nextVariableIndex(body: string): number {
  return countBodyVariables(body) + 1
}

export function sanitizeDisplayName(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export function isUrlLikeName(raw: string): boolean {
  const t = raw.trim()
  if (!t) return false
  if (/https?:\/\//i.test(t) || /^www\./i.test(t)) return true
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/[\w./?%&=-]*)?$/i.test(t)) return true
  return false
}

export function assertValidTemplateName(raw: string): string {
  if (isUrlLikeName(raw)) {
    throw new Error('Name cannot be a URL. Use letters, numbers, and underscores only.')
  }
  const safe = sanitizeDisplayName(raw)
  if (!safe || safe.includes('http') || safe.includes('www')) {
    throw new Error('Enter a valid name (letters, numbers, and underscores).')
  }
  return safe
}

export const BODY_MAX = 1024
export const HEADER_MAX = 60
export const FOOTER_MAX = 60
export const BUTTON_LABEL_MAX = 25

export const HEADER_MEDIA_ACCEPT: Record<Exclude<HeaderFormat, 'none' | 'text'>, string> = {
  image: 'image/jpeg,image/png',
  video: 'video/mp4',
  document: 'application/pdf',
}

export const HEADER_MEDIA_HINT: Record<Exclude<HeaderFormat, 'none' | 'text'>, string> = {
  image: 'JPEG or PNG, max 5 MB',
  video: 'MP4, max 16 MB',
  document: 'PDF, max 100 MB',
}

export const TEMPLATE_LANGUAGES = [
  { value: 'en_US', label: 'English (US) · en_US' },
  { value: 'en', label: 'English · en' },
  { value: 'en_GB', label: 'English (UK) · en_GB' },
  { value: 'hi', label: 'Hindi · hi' },
  { value: 'es', label: 'Spanish · es' },
  { value: 'pt_BR', label: 'Portuguese (BR) · pt_BR' },
  { value: 'ar', label: 'Arabic · ar' },
  { value: 'fr', label: 'French · fr' },
  { value: 'de', label: 'German · de' },
  { value: 'id', label: 'Indonesian · id' },
] as const
