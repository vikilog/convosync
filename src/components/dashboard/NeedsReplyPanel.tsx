import { ArrowUpRight, CheckCircle2 } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChannelIcon, isChannelKind } from '@/components/channel-icon'
import { formatRelativeTime } from '@/lib/chartUtils'
import type { WaitingConversation } from '@/lib/dashboardMockData'

interface NeedsReplyPanelProps {
  conversations: WaitingConversation[]
  onOpenInbox: () => void
}

function urgencyVariant(waitMinutes: number): 'destructive' | 'default' | 'secondary' {
  if (waitMinutes >= 120) return 'destructive'
  if (waitMinutes >= 30) return 'default'
  return 'secondary'
}

export function NeedsReplyPanel({ conversations, onOpenInbox }: NeedsReplyPanelProps) {
  const items = conversations.slice(0, 5)
  const now = Date.now()

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Needs a reply</CardTitle>
        {conversations.length > 0 ? (
          <CardAction>
            <Badge variant="destructive">{conversations.length}</Badge>
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="text-primary h-7 w-7" aria-hidden />
            <p className="mt-2 text-sm font-medium">You're all caught up</p>
            <p className="text-muted-foreground mt-0.5 text-xs">No unread conversations waiting.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((c) => {
              const waitMs = Math.max(0, now - new Date(c.lastMessageAt).getTime())
              const waitMinutes = waitMs / 60_000

              return (
                <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar className="size-7">
                    {c.contactAvatar ? <AvatarImage src={c.contactAvatar} alt="" /> : null}
                    <AvatarFallback>{(c.contactName || '?').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">{c.contactName}</p>
                      {isChannelKind(c.channel) ? (
                        <span className="flex shrink-0 items-center">
                          <ChannelIcon channel={c.channel} className="size-3" />
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">{c.lastMessage || '—'}</p>
                  </div>
                  <Badge variant={urgencyVariant(waitMinutes)} className="shrink-0">
                    {formatRelativeTime(new Date(c.lastMessageAt).getTime(), now)}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      <CardFooter>
        <Button variant="link" size="sm" className="mx-auto" onClick={onOpenInbox}>
          View inbox
          <ArrowUpRight />
        </Button>
      </CardFooter>
    </Card>
  )
}
