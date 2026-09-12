import { Check, CheckCheck, Clock } from 'lucide-react'

/**
 * Outgoing-message status ticks, WhatsApp-style. Backend status enum:
 * sent | delivered | read | failed | resend_pending | resent | sending.
 *
 * `readClassName` lets callers pick a "read" color that contrasts with their
 * bubble background — a bright solid color stands out from the dimmer
 * sent/delivered ticks either way, since those never pass a color override.
 */
export function MessageTicks({
  status,
  readClassName = 'text-sky-500',
}: {
  status: string
  readClassName?: string
}) {
  if (status === 'sending' || status === 'resend_pending') {
    return <Clock className="size-3" />
  }
  if (status === 'read') {
    return <CheckCheck className={`size-3.5 ${readClassName}`} />
  }
  if (status === 'delivered' || status === 'resent') {
    return <CheckCheck className="size-3.5" />
  }
  if (status === 'sent') {
    return <Check className="size-3.5" />
  }
  return null
}
