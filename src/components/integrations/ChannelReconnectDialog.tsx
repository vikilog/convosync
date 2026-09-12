import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export type ReconnectAlert = {
  id: string
  channelLabel: string
  title: string
  reason: 'expired' | 'revoked'
}

export function ChannelReconnectDialog({
  open,
  alerts,
  onReconnect,
  onDismiss,
}: {
  open: boolean
  alerts: ReconnectAlert[]
  onReconnect: (alert: ReconnectAlert) => void
  onDismiss: () => void
}) {
  return (
    <Sheet open={open && alerts.length > 0} onOpenChange={(next) => !next && onDismiss()}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" />
            Connection needs attention
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-3 px-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-wide text-amber-700 uppercase">
                  {alert.channelLabel}
                </p>
                <p className="truncate text-sm font-semibold">{alert.title}</p>
                <p className="text-muted-foreground text-xs">
                  {alert.reason === 'revoked'
                    ? 'Access was revoked — reconnect to keep messages coming in.'
                    : 'Connection expired — reconnect to keep messages coming in.'}
                </p>
              </div>
              <Button size="sm" onClick={() => onReconnect(alert)}>
                Reconnect
              </Button>
            </div>
          ))}
        </div>

        <SheetFooter>
          <Button variant="ghost" onClick={onDismiss}>
            Remind me later
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
