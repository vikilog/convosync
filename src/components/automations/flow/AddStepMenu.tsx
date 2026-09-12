import { Plus } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  catalogForChannel,
  STEP_CATEGORY_LABELS,
  STEP_CATEGORY_ORDER,
  STEP_VISUAL,
  type FlowStepKind,
} from '@/lib/flowStepTypes'
import type { AutomationChannel } from '@/services/realAutomations.service'

export function AddStepMenu({
  onPick,
  label,
  accentClass,
  channel = 'whatsapp',
}: {
  onPick: (kind: FlowStepKind) => void
  label?: string
  accentClass?: string
  channel?: AutomationChannel
}) {
  const items = catalogForChannel(channel)
  const groups = STEP_CATEGORY_ORDER.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((g) => g.items.length > 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`nodrag nopan bg-background text-muted-foreground hover:border-primary hover:text-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed shadow-sm transition-colors ${accentClass ?? ''}`}
          title={label ?? 'Add step'}
        >
          <Plus className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="max-h-80 w-64 overflow-y-auto">
        {groups.map((group, gi) => (
          <div key={group.category}>
            {gi > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>{STEP_CATEGORY_LABELS[group.category]}</DropdownMenuLabel>
            {group.items.map((item) => {
              const visual = STEP_VISUAL[item.kind]
              const Icon = visual.icon
              return (
                <DropdownMenuItem key={item.kind} onClick={() => onPick(item.kind)}>
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md ${visual.iconBg} ${visual.iconText}`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-tight font-medium">{item.label}</p>
                    <p className="text-muted-foreground truncate text-xs">{item.description}</p>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
