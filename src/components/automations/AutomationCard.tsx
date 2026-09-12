import { Pause, Play, Trash2, Workflow } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { ChannelIcon } from '@/components/channel-icon'
import { triggerLabel } from '@/lib/automationLabels'
import type { Automation } from '@/services/realAutomations.service'

const CHANNEL_CHIP_CLASS: Record<Automation['channel'], string> = {
  whatsapp: 'bg-[#25d366]/15 text-[#128C7E]',
  instagram: 'bg-[#833AB4]/12 text-[#833AB4]',
}

function statusBadgeVariant(status: Automation['status']): 'default' | 'outline' {
  return status === 'published' ? 'default' : 'outline'
}

export function AutomationCard({
  automation,
  onOpen,
  onEditFlow,
  onDelete,
  onPublish,
  onPause,
}: {
  automation: Automation
  onOpen: () => void
  onEditFlow: () => void
  onDelete: () => void
  onPublish?: () => void
  onPause?: () => void
}) {
  return (
    <div className="group bg-card hover:border-primary/30 flex items-stretch overflow-hidden rounded-xl border transition-colors">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2.5 text-left"
      >
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${CHANNEL_CHIP_CLASS[automation.channel]}`}
        >
          <ChannelIcon channel={automation.channel} className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="group-hover:text-primary truncate text-sm font-semibold">{automation.name}</h3>
            <Badge variant="outline" className="shrink-0 uppercase">
              {automation.channel === 'whatsapp' ? 'WA' : 'IG'}
            </Badge>
            <Badge variant={statusBadgeVariant(automation.status)} className="shrink-0 capitalize">
              {automation.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {triggerLabel(automation.channel, automation.triggerEvent)}
            <span className="text-border mx-1">·</span>
            {automation.stepCount} steps
            <span className="text-border mx-1">·</span>
            {automation.runs.toLocaleString()} runs
          </p>
        </div>
      </button>
      {automation.status === 'draft' && onPublish ? (
        <button
          type="button"
          onClick={onPublish}
          className="text-muted-foreground hover:bg-primary/10 hover:text-primary shrink-0 cursor-pointer border-l px-2.5 transition-colors"
          aria-label={`Publish ${automation.name}`}
          title="Publish"
        >
          <Play className="size-3.5" />
        </button>
      ) : null}
      {automation.status === 'published' && onPause ? (
        <button
          type="button"
          onClick={onPause}
          className="text-muted-foreground hover:bg-primary/10 hover:text-primary shrink-0 cursor-pointer border-l px-2.5 transition-colors"
          aria-label={`Pause ${automation.name}`}
          title="Pause"
        >
          <Pause className="size-3.5" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onEditFlow}
        className="text-muted-foreground hover:bg-primary/10 hover:text-primary shrink-0 cursor-pointer border-l px-2.5 transition-colors"
        aria-label={`Edit ${automation.name} flow`}
        title="Edit flow"
      >
        <Workflow className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 cursor-pointer border-l px-2.5 transition-colors"
        aria-label={`Delete ${automation.name}`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}
