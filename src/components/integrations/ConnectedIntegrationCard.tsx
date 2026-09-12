import { AlertTriangle, CheckCircle2, RefreshCw, Settings, Unlink2, XCircle } from 'lucide-react'

import { INTEGRATION_VISUAL } from '@/components/integrations/integration-visual'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ConnectedIntegration } from '@/services/realIntegrations.service'

const HEALTH_ICON: Record<ConnectedIntegration['health'], React.ComponentType<{ className?: string }>> = {
  live: CheckCircle2,
  expiring_soon: AlertTriangle,
  error: AlertTriangle,
  expired: XCircle,
  revoked: XCircle,
}

const HEALTH_ICON_CLASS: Record<ConnectedIntegration['health'], string> = {
  live: 'text-emerald-600',
  expiring_soon: 'text-amber-600',
  error: 'text-amber-600',
  expired: 'text-destructive',
  revoked: 'text-destructive',
}

const HEALTH_STATUS_TEXT: Record<ConnectedIntegration['health'], string> = {
  live: 'Connected · Inbox ready',
  expiring_soon: 'Token expiring soon — reconnect recommended',
  error: 'Token check failed — reconnect if messaging breaks',
  expired: 'Reconnect required',
  revoked: 'Reconnect required',
}

export function ConnectedIntegrationCard({
  integration,
  onSync,
  onManage,
  onDisconnect,
}: {
  integration: ConnectedIntegration
  onSync?: () => void
  onManage?: () => void
  onDisconnect: () => void
}) {
  const visual = INTEGRATION_VISUAL[integration.channel]
  const Icon = visual.icon
  const HealthIcon = HEALTH_ICON[integration.health]

  return (
    <div className="bg-card flex h-full flex-col gap-2 rounded-xl border p-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar className={`size-9 shrink-0 ${visual.bg}`}>
          <AvatarFallback className={`bg-transparent ${visual.text}`}>
            <Icon className="size-4" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold">{integration.title}</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <HealthIcon className={`size-4 shrink-0 ${HEALTH_ICON_CLASS[integration.health]}`} />
              </TooltipTrigger>
              <TooltipContent>{HEALTH_STATUS_TEXT[integration.health]}</TooltipContent>
            </Tooltip>
          </div>
          <p className="text-muted-foreground truncate text-xs">{integration.subtitle}</p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {onSync ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon-sm" onClick={onSync} aria-label="Sync">
                  <RefreshCw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sync</TooltipContent>
            </Tooltip>
          ) : null}
          {onManage ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon-sm" onClick={onManage} aria-label="Manage">
                  <Settings />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Manage</TooltipContent>
            </Tooltip>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon-sm" onClick={onDisconnect} aria-label="Disconnect">
                <Unlink2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Disconnect</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
