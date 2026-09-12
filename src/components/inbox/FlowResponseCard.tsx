import { ClipboardCheck } from 'lucide-react'

import { formatBubbleTime } from '@/lib/inboxTime'
import type { ConversationMessage } from '@/services/realInbox.service'

export type FlowResponseMetadata = { flowName?: string; fields: Record<string, unknown> }

export function isFlowResponseMetadata(
  metadata: ConversationMessage['metadata']
): metadata is FlowResponseMetadata {
  if (!metadata || typeof metadata !== 'object') return false
  const fields = (metadata as Record<string, unknown>).fields
  return Boolean(fields && typeof fields === 'object' && !Array.isArray(fields))
}

/** "contact_name" / "contactName" -> "Contact Name" */
function humanizeFieldName(key: string): string {
  const spaced = key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
  return spaced.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function FlowResponseCard({ message }: { message: ConversationMessage }) {
  const meta = message.metadata as FlowResponseMetadata
  const entries = Object.entries(meta.fields)

  return (
    <div className="bg-card w-full max-w-[45%] overflow-hidden rounded-2xl rounded-tl-md border">
      <div className="flex items-center gap-2 border-b px-3.5 py-2.5">
        <ClipboardCheck className="text-channel-green size-4 shrink-0" />
        <p className="text-sm font-semibold">{meta.flowName ? `${meta.flowName} completed` : 'Flow completed'}</p>
      </div>
      <dl className="space-y-2 px-3.5 py-2.5">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
              {humanizeFieldName(key)}
            </dt>
            <dd className="text-sm break-words">{String(value)}</dd>
          </div>
        ))}
      </dl>
      <p className="text-muted-foreground px-3.5 pb-2.5 text-[10px]">{formatBubbleTime(message.createdAt)}</p>
    </div>
  )
}
