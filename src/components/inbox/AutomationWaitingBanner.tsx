import { PauseCircle } from 'lucide-react'

import type { ContactJourneyProgress } from '@/services/realAutomations.service'
import type { InboxChannel } from '@/services/realInbox.service'

export function AutomationWaitingBanner({
  progress,
  channel,
  automationsPaused,
}: {
  progress: ContactJourneyProgress | null | undefined
  channel: InboxChannel
  automationsPaused: boolean
}) {
  if (!progress || progress.status !== 'waiting') return null
  const current = progress.steps.find((s) => s.state === 'current')
  const kind = automationsPaused
    ? 'paused'
    : current?.type === 'ASK_QUESTION' || (current?.detail || '').toLowerCase().includes('reply')
      ? 'reply'
      : current?.type === 'WAIT'
        ? 'delay'
        : 'other'
  const label = channel === 'instagram' ? 'Instagram Automation' : 'WhatsApp Automation'
  const copy =
    kind === 'paused'
      ? `${label} is paused for this contact — it won't resume automatically`
      : kind === 'reply'
        ? `${label} "${progress.journeyName}" is waiting on this reply`
        : kind === 'delay'
          ? `${label} "${progress.journeyName}" is paused on a wait step`
          : `${label} "${progress.journeyName}" is waiting`
  return (
    <div
      role="status"
      className={`mx-3 mb-1 flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 ${
        kind === 'paused' ? 'border-slate-200 bg-slate-50/90' : 'border-amber-200 bg-amber-50/90'
      }`}
    >
      <PauseCircle className="mt-0.5 size-4 shrink-0 text-amber-700" />
      <p className="min-w-0 text-xs font-medium text-amber-900">{copy}</p>
    </div>
  )
}
