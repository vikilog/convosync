import { splitPhone } from '@/lib/locale/dialCodes'

/** Plivo/WhatsApp SIP ids arrive as `+9139…WhatsApp-p1.live…` or `sip:user@host`. */
export function displayCallerNumber(raw: string | null | undefined): string {
  if (!raw?.trim()) return ''
  const local = raw.replace(/^sip:/i, '').split('@')[0]
  const head = local.replace(/[a-zA-Z].*$/, '').trim()
  let digits = head.replace(/\D/g, '')
  // ponytail: 10-digit caller ids are IN, same as outbound dest in plivoCallClient. Non-IN 10-digit SIPs would need the source country.
  if (digits.length === 10) digits = `91${digits}`
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
