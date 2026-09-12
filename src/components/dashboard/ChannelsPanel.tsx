import { CheckCircle2, Lock, Plug } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHANNEL_ICON_CLASS, ChannelIcon } from '@/components/channel-icon'
import type { DashboardChannel, PlanChannelKind } from '@/lib/dashboardMockData'

interface ChannelsPanelProps {
  channels: DashboardChannel[]
  onConnect: (kind: PlanChannelKind) => void
  onUpgrade: () => void
}

export function ChannelsPanel({ channels, onConnect, onUpgrade }: ChannelsPanelProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Channels</CardTitle>
      </CardHeader>

      <CardContent>
        <ul className="divide-y">
          {channels.map((channel) => (
            <li key={channel.kind} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${CHANNEL_ICON_CLASS[channel.kind]}`}
              >
                <ChannelIcon channel={channel.kind} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{channel.label}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {!channel.allowedByPlan
                    ? 'Not on your plan'
                    : channel.connected
                      ? channel.detail || 'Connected'
                      : 'Not connected'}
                </p>
              </div>

              {!channel.allowedByPlan ? (
                <Button variant="ghost" size="sm" onClick={onUpgrade}>
                  <Lock />
                  Upgrade
                </Button>
              ) : channel.connected ? (
                <Badge variant="secondary">
                  <CheckCircle2 />
                  Connected
                </Badge>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => onConnect(channel.kind)}>
                  <Plug />
                  Connect
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
