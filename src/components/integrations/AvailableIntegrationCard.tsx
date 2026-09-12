import { Check, Plus, Send, Settings } from 'lucide-react'

import { INTEGRATION_VISUAL } from '@/components/integrations/integration-visual'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { AvailableIntegration } from '@/services/realIntegrations.service'

function connectIconFor(integration: AvailableIntegration) {
  if (integration.disabled) return Check
  switch (integration.connectLabel) {
    case 'Manage':
      return Settings
    case 'Request access':
      return Send
    default:
      return Plus
  }
}

export function AvailableIntegrationCard({
  integration,
  onConnect,
}: {
  integration: AvailableIntegration
  onConnect: () => void
}) {
  const visual = INTEGRATION_VISUAL[integration.channel]
  const Icon = visual.icon
  const ActionIcon = connectIconFor(integration)
  const actionLabel = integration.connectLabel ?? 'Connect'

  return (
    <div className="bg-card flex flex-col gap-2.5 rounded-xl border p-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${visual.bg}`}>
          <Icon className={`size-4 ${visual.text}`} />
        </div>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{integration.title}</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={integration.disabled ? 'ghost' : 'outline'}
              className="size-8 shrink-0 rounded-full"
              disabled={integration.disabled}
              onClick={onConnect}
              aria-label={actionLabel}
            >
              <ActionIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{actionLabel}</TooltipContent>
        </Tooltip>
      </div>
      <p className="text-muted-foreground line-clamp-2 text-xs leading-snug">{integration.description}</p>
    </div>
  )
}
