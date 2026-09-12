import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCheck,
  CheckCircle2,
  Info,
  Megaphone,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatRelativeTime } from '@/lib/chartUtils'
import { getSocket } from '@/lib/socket'
import {
  notificationsService,
  type InAppNotification,
} from '@/services/notifications.service'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'system', label: 'System' },
  { id: 'activity', label: 'Activity' },
] as const

type TabId = (typeof TABS)[number]['id']

function SeverityIcon({ severity }: { severity: string }) {
  const cls = 'size-4 shrink-0'
  if (severity === 'success') return <CheckCircle2 className={`${cls} text-emerald-600`} />
  if (severity === 'failure') return <XCircle className={`${cls} text-red-600`} />
  if (severity === 'warning') return <AlertTriangle className={`${cls} text-amber-600`} />
  return <Info className={`${cls} text-sky-600`} />
}

export function NotificationsPanel({
  open,
  onClose,
  onUnreadChange,
}: {
  open: boolean
  onClose: () => void
  onUnreadChange?: (n: number) => void
}) {
  const [tab, setTab] = useState<TabId>('all')
  const isActivity = tab === 'activity'
  const list = notificationsService.useList(isActivity ? 'all' : tab, open && !isActivity)
  const activity = notificationsService.useActivity(open && isActivity)
  const unread = notificationsService.useUnreadCount()
  const markRead = notificationsService.useMarkRead()
  const markAll = notificationsService.useMarkAllRead()

  const items = isActivity ? (activity.data?.items ?? []) : (list.data?.items ?? [])
  const loading = isActivity ? activity.isLoading : list.isLoading

  useEffect(() => {
    if (unread.data?.unread != null) onUnreadChange?.(unread.data.unread)
  }, [unread.data?.unread, onUnreadChange])

  const refetchUnread = unread.refetch
  const refetchList = list.refetch

  useEffect(() => {
    const socket = getSocket()
    const onNote = (payload: InAppNotification) => {
      if (payload.forBell === false) return
      void refetchUnread()
      void refetchList()
    }
    socket.on('workspace_notification', onNote)
    return () => {
      socket.off('workspace_notification', onNote)
    }
  }, [refetchUnread, refetchList])

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <SheetTitle>{isActivity ? 'Recent activity' : 'Notifications'}</SheetTitle>
            {!isActivity ? (
              <Button variant="ghost" size="sm" onClick={() => markAll.mutate()}>
                <CheckCheck />
                Mark all read
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="px-4">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <ScrollArea className="min-h-0 flex-1">
          {loading && items.length === 0 ? (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">Loading…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              {isActivity ? (
                <Activity className="text-muted-foreground size-8" />
              ) : (
                <Megaphone className="text-muted-foreground size-8" />
              )}
              <p className="text-muted-foreground text-sm">
                {isActivity ? 'No recent activity' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id}>
                  {isActivity ? (
                    <div className="flex w-full gap-3 px-4 py-3 text-left">
                      <SeverityIcon severity={item.severity} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-muted-foreground"> — {item.message}</span>
                        </p>
                        <p className="text-muted-foreground mt-1 text-[11px]">
                          {formatRelativeTime(Date.parse(item.createdAt))}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (item.unread) markRead.mutate(item.id)
                      }}
                      className={`flex w-full gap-3 px-4 py-3 text-left ${item.unread ? 'bg-muted/50' : ''}`}
                    >
                      <SeverityIcon severity={item.severity} />
                      <div className="min-w-0 flex-1">
                        <p className="text-muted-foreground text-xs font-medium">{item.title}</p>
                        <p className="mt-0.5 text-sm">{item.message}</p>
                        <p className="text-muted-foreground mt-1 text-[11px]">
                          {formatRelativeTime(Date.parse(item.createdAt))}
                        </p>
                      </div>
                      {item.unread ? (
                        <span className="bg-primary mt-1.5 size-2 shrink-0 rounded-full" />
                      ) : null}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
