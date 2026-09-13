import { DIAL_BY_ISO, splitPhone } from '@/lib/locale/dialCodes'

/**
 * Plivo/Telnyx/WhatsApp SIP ids arrive as `+9139…WhatsApp-p1.live…` or `sip:user@host`,
 * sometimes as a bare local number with no country code. `countryIso` picks which dial
 * code to assume in that bare-number case — pass the number's own provider/workspace
 * country (defaults to 'IN' to match this app's original Plivo-only behavior).
 */
export function displayCallerNumber(raw: string | null | undefined, countryIso = 'IN'): string {
  if (!raw?.trim()) return ''
  const local = raw.replace(/^sip:/i, '').split('@')[0]
  const head = local.replace(/[a-zA-Z].*$/, '').trim()
  let digits = head.replace(/\D/g, '')
  const dialCode = DIAL_BY_ISO[countryIso.toUpperCase()] ?? DIAL_BY_ISO.IN
  // A bare local number (no country code) arrives at the ISO's national significant-number
  // length for IN/US/SG (10 digits) — GB numbers vary, so this heuristic only applies there.
  if (digits.length === 10 && countryIso.toUpperCase() !== 'GB') digits = `${dialCode}${digits}`
  if (digits.length < 10) return head || raw
  const { dial, national } = splitPhone(`+${digits}`)
  return `${dial} ${national}`
}

export function isWhatsAppCaller(raw: string | null | undefined): boolean {
  return /whatsapp/i.test(raw ?? '')
}

export function callerInitials(name: string | null | undefined, number: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length) return parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
  const digits = number.replace(/\D/g, '')
  return digits.slice(-2) || '?'
}
