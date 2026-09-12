import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Activity, Bell, CalendarClock, Inbox, Send, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DashboardStatRail, type DashboardStat } from '@/components/dashboard/DashboardStatRail'
import { MessagePerformanceChart } from '@/components/dashboard/MessagePerformanceChart'
import { DashboardCampaignsPanel } from '@/components/dashboard/DashboardCampaignsPanel'
import { NeedsReplyPanel } from '@/components/dashboard/NeedsReplyPanel'
import { AiAgentsPanel } from '@/components/dashboard/AiAgentsPanel'
import { ChannelsPanel } from '@/components/dashboard/ChannelsPanel'
import { TeamPanel } from '@/components/dashboard/TeamPanel'
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel'
import { OnboardingProfileBanner } from '@/components/onboarding/OnboardingProfileBanner'
import { useAuth } from '@/context/AuthContext'
import { useCountUp } from '@/hooks/useCountUp'
import type { ChartPoint } from '@/lib/chartUtils'
import { getFirstName, getTimeGreeting, isChartEmpty } from '@/lib/chartUtils'
import type { DashboardChannel, PlanChannelKind } from '@/lib/dashboardMockData'
import {
  channelAllowedByPlan,
  pathForCampaign,
  pathForIntegrationsChannel,
  pathForNewCampaign,
  pathForSettingsSection,
  waitingOldestFirst,
} from '@/lib/planChannels'
import { realBillingService } from '@/services/realBilling.service'
import { realAutomationsService } from '@/services/realAutomations.service'
import { realInboxService } from '@/services/realInbox.service'
import { realIntegrationsService } from '@/services/realIntegrations.service'
import { realWorkspaceMembersService } from '@/services/realWorkspaceMembers.service'
import { dashboardService, type DashboardCampaign } from '@/services/dashboard.service'
import { notificationsService } from '@/services/notifications.service'

type ChartRange = 7 | 14 | 30

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function toQuickCampaign(c: DashboardCampaign) {
  return { ...c, date: formatShortDate(c.sentAt ?? c.createdAt) }
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Skeleton className="h-64 lg:col-span-3" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [chartRange, setChartRange] = useState<ChartRange>(7)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifUnread, setNotifUnread] = useState(0)

  const { data: totals, isLoading: totalsLoading } = dashboardService.useTotals()
  const { data: messagePoints } = dashboardService.useMessagePerformance(chartRange)
  const { data: team = [] } = dashboardService.useTeam()
  const { data: recentCampaigns = [] } = dashboardService.useRecentCampaigns()
  const { data: upcomingCampaigns = [] } = dashboardService.useUpcomingCampaigns()
  const { data: aiAgents = [] } = dashboardService.useAiAgents()
  const { data: conversations = [] } = realInboxService.useList()
  const { data: automations = [] } = realAutomationsService.useList()
  const { data: members = [] } = realWorkspaceMembersService.useList()
  const { data: subscription } = realBillingService.useSubscription()
  const whatsapp = realIntegrationsService.useWhatsAppStatus()
  const instagram = realIntegrationsService.useInstagramAccounts()
  const messenger = realIntegrationsService.useMessengerAccounts()
  const telegram = realIntegrationsService.useTelegramAccounts()
  const email = realIntegrationsService.useEmailIntegration()
  const { data: unreadRes } = notificationsService.useUnreadCount()

  useEffect(() => {
    if (unreadRes?.unread != null) setNotifUnread(unreadRes.unread)
  }, [unreadRes?.unread])

  useEffect(() => {
    const onFocus = () => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['realIntegrations'] })
      void queryClient.invalidateQueries({ queryKey: ['realAutomations'] })
      void queryClient.invalidateQueries({ queryKey: ['realInbox'] })
      void queryClient.invalidateQueries({ queryKey: ['realBilling'] })
      void queryClient.invalidateQueries({ queryKey: ['realWorkspaceMembers'] })
      void queryClient.invalidateQueries({ queryKey: ['inAppNotifications'] })
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] })
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [queryClient])

  const publishedAutomations = automations.filter((a) => a.status === 'published').length
  const draftAutomations = automations.filter((a) => a.status === 'draft').length
  const automationRuns = automations.reduce((sum, a) => sum + a.runs, 0)

  const contactsCount = useCountUp(totals?.totalContacts ?? 0, 1000, !totalsLoading)
  const messagesCount = useCountUp(totals?.messagesToday ?? 0, 1000, !totalsLoading)
  const automationsCount = useCountUp(publishedAutomations, 1000, !totalsLoading)
  const openConversationsCount = useCountUp(totals?.openConversations ?? 0, 1000, !totalsLoading)
  const scheduledCampaignsCount = useCountUp(upcomingCampaigns.length, 1000)

  const chartData: ChartPoint[] = useMemo(
    () => (messagePoints ?? []).map((p) => ({ day: formatShortDate(p.date), ...p })),
    [messagePoints]
  )
  const showChartEmpty = useMemo(() => isChartEmpty(chartData), [chartData])
  const messagesSpark = useMemo(() => {
    const values = chartData.map((d) => d.sent)
    return values.length >= 2 && !showChartEmpty ? values : undefined
  }, [chartData, showChartEmpty])

  const waitingConversations = useMemo(
    () =>
      waitingOldestFirst(conversations).map((c) => ({
        id: c.id,
        contactName: c.contact.name,
        contactAvatar: c.contact.avatar,
        channel: c.channel,
        lastMessage: c.lastMessage ?? '',
        lastMessageAt: c.lastMessageAt ?? c.updatedAt,
      })),
    [conversations]
  )

  const planChannels = subscription?.currentPlan?.features?.channels
  const channels: DashboardChannel[] = useMemo(() => {
    const waAccounts = whatsapp.data?.accounts ?? []
    const igAccounts = instagram.data?.accounts ?? []
    const mgAccounts = messenger.data?.accounts ?? []
    const tgAccounts = telegram.data?.accounts ?? []
    const emailEnabled = Boolean(email.data?.enabled)

    const row = (
      kind: PlanChannelKind,
      label: string,
      connected: boolean,
      detail?: string
    ): DashboardChannel => ({
      kind,
      label,
      connected,
      allowedByPlan: channelAllowedByPlan(planChannels, kind),
      detail,
    })

    return [
      row(
        'whatsapp',
        'WhatsApp',
        waAccounts.length > 0,
        waAccounts.length > 0
          ? `${waAccounts.length} number${waAccounts.length === 1 ? '' : 's'} connected`
          : undefined
      ),
      row('instagram', 'Instagram', igAccounts.length > 0),
      row('messenger', 'Messenger', mgAccounts.length > 0),
      row(
        'email',
        'Email',
        emailEnabled,
        email.data?.providerLabel || undefined
      ),
      row(
        'telegram',
        'Telegram',
        tgAccounts.length > 0,
        tgAccounts.length > 0
          ? `${tgAccounts.length} bot${tgAccounts.length === 1 ? '' : 's'} connected`
          : undefined
      ),
    ]
  }, [whatsapp.data, instagram.data, messenger.data, telegram.data, email.data, planChannels])

  const teamMembers = useMemo(() => {
    const counts = new Map(team.map((t) => [t.id, t.conversationsCount]))
    if (members.length === 0) {
      return team.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        isOwner: m.isOwner,
        conversationsCount: m.conversationsCount,
      }))
    }
    return members.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      avatar: m.avatar,
      isOwner: m.isOwner,
      conversationsCount: counts.get(m.userId),
    }))
  }, [members, team])

  const stats: DashboardStat[] = useMemo(
    () => [
      {
        key: 'contacts',
        icon: Users,
        label: 'Total contacts',
        value: contactsCount.toLocaleString(),
      },
      {
        key: 'messages',
        icon: Send,
        label: 'Messages today',
        value: messagesCount.toLocaleString(),
        spark: messagesSpark,
      },
      {
        key: 'conversations',
        icon: Inbox,
        label: 'Open conversations',
        value: openConversationsCount.toLocaleString(),
      },
      {
        key: 'scheduled',
        icon: CalendarClock,
        label: 'Scheduled campaigns',
        value: scheduledCampaignsCount.toLocaleString(),
      },
      {
        key: 'automations',
        icon: Activity,
        label: 'Automations',
        value: automationsCount.toLocaleString(),
        meta: (
          <span className="flex items-center gap-1.5">
            {draftAutomations > 0 ? <span>{draftAutomations} draft</span> : null}
            <span>{automationRuns.toLocaleString()} runs</span>
          </span>
        ),
      },
    ],
    [
      contactsCount,
      messagesCount,
      messagesSpark,
      openConversationsCount,
      scheduledCampaignsCount,
      automationsCount,
      draftAutomations,
      automationRuns,
    ]
  )

  const firstName = getFirstName(user?.name ?? '')
  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (totalsLoading && !totals) return <DashboardSkeleton />

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {getTimeGreeting()}, {firstName} · {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            Last {chartRange} Days
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="relative"
            aria-label="Notifications"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <Bell />
            {notifUnread > 0 ? (
              <span className="border-background bg-destructive absolute -top-0.5 -right-0.5 size-2 rounded-full border-2" />
            ) : null}
          </Button>
          <Avatar>
            {user?.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
            <AvatarFallback>{firstName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <NotificationsPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={setNotifUnread}
      />

      <OnboardingProfileBanner />

      <DashboardStatRail stats={stats} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-stretch">
        <div className="lg:col-span-3">
          <MessagePerformanceChart
            data={showChartEmpty ? [] : chartData}
            activeRange={chartRange}
            onRangeChange={setChartRange}
            onNewCampaign={() => navigate(pathForNewCampaign())}
          />
        </div>
        <div className="lg:col-span-2">
          <DashboardCampaignsPanel
            upcoming={upcomingCampaigns.map(toQuickCampaign)}
            recent={recentCampaigns.map(toQuickCampaign)}
            onNewCampaign={() => navigate(pathForNewCampaign())}
            onViewAll={() => navigate('/campaigns')}
            onOpenCampaign={(id) => navigate(pathForCampaign(id))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
        <NeedsReplyPanel conversations={waitingConversations} onOpenInbox={() => navigate('/inbox')} />
        <AiAgentsPanel
          agents={aiAgents.map((a) => ({
            id: a.id,
            name: a.name,
            role: a.role,
            avatarUrl: a.avatarUrl,
            isEnabled: a.isEnabled,
          }))}
          onViewAll={() => navigate('/ai-agent')}
        />
        <ChannelsPanel
          channels={channels}
          onConnect={(kind) => navigate(pathForIntegrationsChannel(kind))}
          onUpgrade={() => navigate(pathForSettingsSection('subscription'))}
        />
        <TeamPanel
          members={teamMembers}
          onViewAll={() => navigate(pathForSettingsSection('users'))}
        />
      </div>
    </div>
  )
}
