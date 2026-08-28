/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Send, Clock, Activity, Inbox, CalendarClock, TrendingUp } from 'lucide-react';
import { useKeepAliveActivation } from './KeepAlive';
import { QuickCampaign } from '../types';
import { api, getUserName } from '../lib/api';
import { mapChartDay, mapQuickCampaignFromApi } from '../lib/mappers';
import { OnboardingProfileBanner } from './onboarding/OnboardingProfileBanner';
import { DashboardStatRail, type DashboardStat } from './dashboard/DashboardStatRail';
import { MessagePerformanceChart } from './dashboard/MessagePerformanceChart';
import { DashboardCampaignsPanel } from './dashboard/DashboardCampaignsPanel';
import { NeedsReplyPanel, type WaitingConversation } from './dashboard/NeedsReplyPanel';
import { AiAgentsPanel, type DashboardAgent } from './dashboard/AiAgentsPanel';
import { ChannelsPanel, type DashboardChannel } from './dashboard/ChannelsPanel';
import { TeamPanel, type DashboardTeamMember } from './dashboard/TeamPanel';
import { useCountUp } from '../hooks/useCountUp';
import {
  normalizeChartData,
  isChartEmpty,
  getTimeGreeting,
  getFirstName,
  type ChartPoint,
} from '../lib/chartUtils';
import {
  channelAllowedByPlan,
  planFeaturesFromSubscription,
  PLAN_UPGRADE_PATH,
  type PlanFeatureFlags,
} from '../lib/planEntitlements';
import {
  pathForTab,
  pathForCampaign,
  pathForIntegrationsChannel,
  pathForSettingsSection,
} from '../routes';

interface DashboardViewProps {
  onAddContact?: () => void;
  onNewCampaign?: () => void;
  onNewJourney?: () => void;
  onImportCSV?: () => void;
}

type ChartRange = 7 | 14 | 30;

export const DashboardView: React.FC<DashboardViewProps> = ({
  onAddContact = () => {},
  onNewCampaign = () => {},
  onNewJourney = () => {},
  onImportCSV = () => {},
}) => {
  const navigate = useNavigate();
  const [totalContacts, setTotalContacts] = useState(0);
  const [messagesToday, setMessagesToday] = useState(0);
  const [publishedAutomations, setPublishedAutomations] = useState(0);
  const [draftAutomations, setDraftAutomations] = useState(0);
  const [automationRuns, setAutomationRuns] = useState(0);
  const [openConversations, setOpenConversations] = useState(0);
  const [performanceData, setPerformanceData] = useState<ChartPoint[]>([]);
  const [quickCampaigns, setQuickCampaigns] = useState<QuickCampaign[]>([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState<QuickCampaign[]>([]);
  const [waitingConversations, setWaitingConversations] = useState<WaitingConversation[]>([]);
  const [agents, setAgents] = useState<DashboardAgent[]>([]);
  const [channels, setChannels] = useState<DashboardChannel[]>([]);
  const [teamMembers, setTeamMembers] = useState<DashboardTeamMember[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>(7);
  const [loading, setLoading] = useState(true);

  const contactsCount = useCountUp(totalContacts, 1000);
  const messagesCount = useCountUp(messagesToday, 1000);
  const automationsCount = useCountUp(publishedAutomations, 1000);
  const openConversationsCount = useCountUp(openConversations, 1000);
  const scheduledCampaignsCount = useCountUp(upcomingCampaigns.length, 1000);

  const chartData = useMemo(() => {
    return normalizeChartData(performanceData, chartRange);
  }, [performanceData, chartRange]);

  const showChartEmpty = useMemo(() => isChartEmpty(chartData), [chartData]);

  const messagesSpark = useMemo(() => {
    const values = chartData.map((d) => d.sent);
    return values.length >= 2 && !showChartEmpty ? values : undefined;
  }, [chartData, showChartEmpty]);

  const stats: DashboardStat[] = useMemo(
    () => [
      {
        key: 'contacts',
        icon: Users,
        label: 'Total contacts',
        value: contactsCount.toLocaleString(),
        meta: (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-swiss-accent">
            <TrendingUp className="h-3 w-3" aria-hidden />
            +8%
          </span>
        ),
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
        key: 'response',
        icon: Clock,
        label: 'Avg response time',
        value: (
          <span>
            4m <span className="text-lg font-light text-swiss-muted">32s</span>
          </span>
        ),
      },
      {
        key: 'automations',
        icon: Activity,
        label: 'Automations',
        value: automationsCount.toLocaleString(),
        meta: (
          <span className="flex shrink-0 items-center gap-1.5">
            {draftAutomations > 0 ? (
              <span className="text-[11px] font-medium text-swiss-accent">
                {draftAutomations} draft
              </span>
            ) : null}
            <span className="text-[11px] text-swiss-muted">
              {automationRuns.toLocaleString()} runs
            </span>
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
  );

  const loadDashboard = useCallback(async () => {
    try {
      const [
        stats,
        chart,
        campaigns,
        upcoming,
        openConvos,
        agentRows,
        whatsappRes,
        instagramRes,
        messengerRes,
        emailRes,
        subscriptionRes,
        waJourneys,
        igJourneys,
        workspaceMembers,
        teamStats,
      ] = await Promise.all([
        api.getDashboardStats(),
        api.getMessageChart(chartRange),
        api.getRecentCampaigns(),
        api.getUpcomingCampaigns(),
        api.getConversations({ status: 'open' }).catch(() => []),
        api.getAgents().catch(() => []),
        api.getWhatsAppAccounts().catch(() => ({ accounts: [] })),
        api.getInstagramAccounts().catch(() => ({ accounts: [] })),
        api.getMessengerAccounts().catch(() => ({ accounts: [] })),
        api.getEmailIntegration().catch(() => ({ enabled: false })),
        api.getSubscription().catch(() => null),
        api.getJourneys().catch(() => []),
        api.getInstagramJourneys().catch(() => []),
        api.getWorkspaceMembers().catch(() => []),
        api.getTeamStats().catch(() => []),
      ]);

      setTotalContacts(stats.totalContacts ?? 0);
      setMessagesToday(stats.messagesToday ?? 0);
      setOpenConversations(stats.openConversations ?? 0);

      const allAutomations = [
        ...(Array.isArray(waJourneys) ? waJourneys : []),
        ...(Array.isArray(igJourneys) ? igJourneys : []),
      ] as Array<{ status: 'draft' | 'published'; _count?: { executions?: number } }>;
      setPublishedAutomations(allAutomations.filter((j) => j.status === 'published').length);
      setDraftAutomations(allAutomations.filter((j) => j.status === 'draft').length);
      setAutomationRuns(
        allAutomations.reduce((sum, j) => sum + (j._count?.executions ?? 0), 0)
      );
      setPerformanceData(
        (chart as { date: string; sent: number; delivered: number; read: number }[]).map(
          (row) => mapChartDay(row, { compact: chartRange > 7 })
        )
      );
      setQuickCampaigns(
        campaigns.map((c: Record<string, unknown>) => mapQuickCampaignFromApi(c))
      );
      setUpcomingCampaigns(
        upcoming.map((c: Record<string, unknown>) => mapQuickCampaignFromApi(c))
      );

      const waiting = (
        Array.isArray(openConvos) ? openConvos : []
      ) as Array<{
        id: string;
        channel: string;
        lastMessage?: string | null;
        lastMessageAt?: string | null;
        unreadCount?: number;
        contact?: { name?: string; avatar?: string | null };
      }>;
      setWaitingConversations(
        waiting
          .filter((c) => (c.unreadCount ?? 0) > 0 && c.lastMessageAt)
          .sort(
            (a, b) =>
              new Date(a.lastMessageAt as string).getTime() -
              new Date(b.lastMessageAt as string).getTime()
          )
          .map((c) => ({
            id: c.id,
            contactName: c.contact?.name || 'Unknown',
            contactAvatar: c.contact?.avatar,
            channel: c.channel,
            lastMessage: c.lastMessage || '',
            lastMessageAt: c.lastMessageAt as string,
          }))
      );

      const agentList = (Array.isArray(agentRows) ? agentRows : []) as Array<{
        id: string;
        name: string;
        role?: string;
        avatarUrl?: string | null;
        isEnabled?: boolean;
      }>;
      setAgents(
        agentList.map((a) => ({
          id: a.id,
          name: a.name,
          role: a.role || 'AI agent',
          avatarUrl: a.avatarUrl,
          isEnabled: Boolean(a.isEnabled),
        }))
      );

      const plan = planFeaturesFromSubscription(
        (subscriptionRes as { currentPlan?: PlanFeatureFlags | null } | null)?.currentPlan
      );
      const whatsappAccounts = (whatsappRes as { accounts?: unknown[] })?.accounts ?? [];
      const instagramAccounts = (instagramRes as { accounts?: unknown[] })?.accounts ?? [];
      const messengerAccounts = (messengerRes as { accounts?: unknown[] })?.accounts ?? [];
      const email = emailRes as { enabled?: boolean; providerLabel?: string | null };

      setChannels([
        {
          kind: 'whatsapp',
          label: 'WhatsApp',
          connected: whatsappAccounts.length > 0,
          allowedByPlan: channelAllowedByPlan(plan, 'whatsapp'),
          detail:
            whatsappAccounts.length > 0
              ? `${whatsappAccounts.length} number${whatsappAccounts.length === 1 ? '' : 's'} connected`
              : undefined,
        },
        {
          kind: 'instagram',
          label: 'Instagram',
          connected: instagramAccounts.length > 0,
          allowedByPlan: channelAllowedByPlan(plan, 'instagram'),
        },
        {
          kind: 'messenger',
          label: 'Messenger',
          connected: messengerAccounts.length > 0,
          allowedByPlan: channelAllowedByPlan(plan, 'messenger'),
        },
        {
          kind: 'email',
          label: 'Email',
          connected: Boolean(email.enabled),
          allowedByPlan: channelAllowedByPlan(plan, 'email'),
          detail: email.providerLabel || undefined,
        },
      ]);

      const members = (Array.isArray(workspaceMembers) ? workspaceMembers : []) as Array<{
        id: string;
        userId: string;
        name: string;
        role: string;
        avatar?: string | null;
        isOwner: boolean;
      }>;
      const memberStats = (Array.isArray(teamStats) ? teamStats : []) as Array<{
        id: string;
        conversationsCount?: number;
      }>;
      const conversationsByUserId = new Map(
        memberStats.map((s) => [s.id, s.conversationsCount ?? 0])
      );
      setTeamMembers(
        members.map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          avatar: m.avatar,
          isOwner: m.isOwner,
          conversationsCount: conversationsByUserId.get(m.userId),
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [chartRange]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useKeepAliveActivation(() => {
    void loadDashboard();
  });

  if (loading) {
    return (
      <div
        className="w-full min-h-full space-y-11 bg-white pb-10 font-swiss"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div className="space-y-3">
          <div className="h-3 w-40 rounded skel" />
          <div className="h-8 w-72 rounded-lg skel" />
        </div>

        <div className="grid grid-cols-1 divide-y divide-swiss-line border-y border-swiss-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={`stat-skel-${i}`} className="space-y-3 px-5 py-5 animate-pulse">
              <div className="h-2.5 w-20 rounded skel" />
              <div className="h-7 w-16 rounded skel" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-5 animate-pulse">
            <div className="flex items-center justify-between gap-3">
              <div className="h-2.5 w-48 rounded skel" />
              <div className="h-2.5 w-24 rounded skel" />
            </div>
            <div className="h-56 rounded skel" />
          </div>
          <div className="lg:col-span-2 space-y-4 animate-pulse">
            <div className="h-2.5 w-36 rounded skel" />
            <div className="space-y-3 divide-y divide-swiss-line">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`recent-skel-${i}`} className="space-y-2 pt-3 first:pt-0">
                  <div className="h-3 w-3/4 rounded skel" />
                  <div className="h-2.5 w-1/2 rounded skel" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, panelIdx) => (
            <div key={`panel-skel-${panelIdx}`} className="space-y-3 animate-pulse">
              <div className="h-2.5 w-24 rounded skel" />
              <div className="space-y-3 divide-y divide-swiss-line">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={`row-skel-${panelIdx}-${i}`} className="flex items-center gap-3 pt-3 first:pt-0">
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded skel" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const firstName = getFirstName(getUserName() || 'there');

  return (
    <div className="w-full min-h-full space-y-11 bg-white pb-10 font-swiss">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[28px] font-light tracking-tight text-swiss-ink">
          {getTimeGreeting()}, {firstName}
        </h1>
        <p className="text-[11px] font-medium tracking-wide text-swiss-muted">
          {new Date()
            .toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
            .split(' ')
            .join(' · ')}
        </p>
      </div>

      <OnboardingProfileBanner />

      <DashboardStatRail stats={stats} />

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-5 lg:items-stretch">
        <div className="lg:col-span-3">
          <MessagePerformanceChart
            data={showChartEmpty ? [] : chartData}
            activeRange={chartRange}
            onRangeChange={setChartRange}
            onNewCampaign={onNewCampaign}
          />
        </div>
        <div className="lg:col-span-2">
          <DashboardCampaignsPanel
            upcoming={upcomingCampaigns}
            recent={quickCampaigns}
            onNewCampaign={onNewCampaign}
            onViewAll={() => navigate(pathForTab('campaigns'))}
            onOpenCampaign={(id) => navigate(pathForCampaign(id))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
        <NeedsReplyPanel
          conversations={waitingConversations}
          onOpenInbox={() => navigate(pathForTab('inbox'))}
        />
        <AiAgentsPanel agents={agents} onViewAll={() => navigate(pathForTab('ai-agent'))} />
        <ChannelsPanel
          channels={channels}
          onConnect={(kind) => navigate(pathForIntegrationsChannel(kind))}
          onUpgrade={() => navigate(PLAN_UPGRADE_PATH)}
        />
        <TeamPanel
          members={teamMembers}
          onViewAll={() => navigate(pathForSettingsSection('users'))}
        />
      </div>
    </div>
  );
};
