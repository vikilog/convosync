export type IntentFallback = 'silent' | 'automated_response' | 'transfer_human'

export const INTENT_FALLBACK_OPTIONS: { id: IntentFallback; label: string }[] = [
  { id: 'silent', label: 'Remain without responding' },
  { id: 'automated_response', label: 'Automated response' },
  { id: 'transfer_human', label: 'Transfer to a human agent' },
]

export function parseIntentFallback(raw: unknown): IntentFallback {
  return raw === 'automated_response' || raw === 'transfer_human' ? raw : 'silent'
}
