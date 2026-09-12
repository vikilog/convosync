import { useState } from 'react'
import { ArrowUpRight, Plus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChannelIcon } from '@/components/channel-icon'
import type { QuickCampaign, QuickCampaignStatus } from '@/lib/dashboardMockData'

interface DashboardCampaignsPanelProps {
  upcoming: QuickCampaign[]
  recent: QuickCampaign[]
  onNewCampaign: () => void
  onViewAll?: () => void
  onOpenCampaign?: (id: string) => void
}

function statusVariant(status: QuickCampaignStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'Running':
    case 'Active':
    case 'Scheduled':
      return 'default'
    case 'Completed':
      return 'secondary'
    case 'Failed':
      return 'destructive'
    default:
      return 'outline'
  }
}

function channelLabel(channel: QuickCampaign['channel']) {
  if (channel === 'whatsapp') return 'WhatsApp'
  if (channel === 'instagram') return 'Instagram'
  return 'Email'
}

function upcomingMeta(c: QuickCampaign): string {
  const when = c.scheduledAt
    ? new Date(c.scheduledAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Draft'
  return `${channelLabel(c.channel)} · ${when}`
}

function recentMeta(c: QuickCampaign): string {
  return `${channelLabel(c.channel)} · ${c.date} · ${c.engagementMetric}`
}

export function DashboardCampaignsPanel({
  upcoming,
  recent,
  onNewCampaign,
  onViewAll,
  onOpenCampaign,
}: DashboardCampaignsPanelProps) {
  const upcomingItems = upcoming.slice(0, 4)
  const recentItems = recent.slice(0, 4)
  const [tab, setTab] = useState<'upcoming' | 'recent'>('upcoming')
  const activeItems = (tab === 'upcoming' ? upcomingItems : recentItems).map((c) => ({
    campaign: c,
    meta: tab === 'upcoming' ? upcomingMeta(c) : recentMeta(c),
  }))

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Campaigns</CardTitle>
        <CardAction>
          <Button size="sm" onClick={onNewCampaign}>
            <Plus />
            New
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'upcoming' | 'recent')}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>
        </Tabs>

        {upcoming.length === 0 && recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm font-medium">No campaigns yet</p>
            <Button variant="link" size="sm" className="mt-2" onClick={onNewCampaign}>
              <Plus />
              Start your first campaign
            </Button>
          </div>
        ) : activeItems.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">No {tab} campaigns.</p>
        ) : (
          <div className="mt-3 divide-y">
            {activeItems.map(({ campaign, meta }) => (
              <button
                key={campaign.id}
                type="button"
                onClick={() => onOpenCampaign?.(campaign.id)}
                className="flex w-full cursor-pointer items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
              >
                <ChannelIcon channel={campaign.channel} className="size-4" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{campaign.name}</p>
                  <p className="text-muted-foreground truncate text-xs">{meta}</p>
                </div>
                <Badge variant={statusVariant(campaign.status)}>{campaign.status}</Badge>
              </button>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button variant="link" size="sm" className="mx-auto" onClick={onViewAll}>
          View all campaigns
          <ArrowUpRight />
        </Button>
      </CardFooter>
    </Card>
  )
}
