/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Send, Clock, Activity } from 'lucide-react';
import { useKeepAliveActivation } from './KeepAlive';
import { TeamMember, QuickCampaign } from '../types';
import { api } from '../lib/api';
import { mapChartDay, mapQuickCampaignFromApi, mapTeamMemberFromApi } from '../lib/mappers';
import { OnboardingProfileBanner } from './onboarding/OnboardingProfileBanner';
import { StatCard } from './dashboard/StatCard';
import { MessagePerformanceChart } from './dashboard/MessagePerformanceChart';
import { RecentCampaignsPanel } from './dashboard/RecentCampaignsPanel';
import { UpcomingCampaignsPanel } from './dashboard/UpcomingCampaignsPanel';
import { TeamPerformanceSection } from './dashboard/TeamPerformanceSection';
import { BottomStatusBar } from './dashboard/BottomStatusBar';
import { useCountUp } from '../hooks/useCountUp';
import {
  normalizeChartData,
  isChartEmpty,
  type ChartPoint,
} from '../lib/chartUtils';
import { pathForSettingsSection, pathForTab, pathForCampaign } from '../routes';

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
  const [activeJourneys, setActiveJourneys] = useState(0);
  const [pausedJourneys, setPausedJourneys] = useState(0);
  const [performanceData, setPerformanceData] = useState<ChartPoint[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [quickCampaigns, setQuickCampaigns] = useState<QuickCampaign[]>([]);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState<QuickCampaign[]>([]);
  const [chartRange, setChartRange] = useState<ChartRange>(7);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [activeAgents, setActiveAgents] = useState(0);
  const [loading, setLoading] = useState(true);

  const contactsCount = useCountUp(totalContacts, 1000);
  const messagesCount = useCountUp(messagesToday, 1000);
  const journeysCount = useCountUp(activeJourneys, 1000);

  const chartData = useMemo(() => {
    return normalizeChartData(performanceData, chartRange);
  }, [performanceData, chartRange]);

  const showChartEmpty = useMemo(() => isChartEmpty(chartData), [chartData]);

  const loadDashboard = useCallback(async () => {
    try {
      const [stats, chart, team, campaigns, upcoming, whatsapp, agents] =
        await Promise.all([
          api.getDashboardStats(),
          api.getMessageChart(chartRange),
          api.getTeamStats(),
          api.getRecentCampaigns(),
          api.getUpcomingCampaigns(),
          api.getWhatsAppStatus().catch(() => null),
          api.getAgents().catch(() => []),
        ]);

      setTotalContacts(stats.totalContacts ?? 0);
      setMessagesToday(stats.messagesToday ?? 0);
      setActiveJourneys(stats.activeJourneys ?? 0);
      setPausedJourneys(stats.pausedJourneys ?? 0);
      setPerformanceData(
        (chart as { date: string; sent: number; delivered: number; read: number }[]).map(
          (row) => mapChartDay(row, { compact: chartRange > 7 })
        )
      );
      setTeamMembers(team.map((m: Record<string, unknown>) => mapTeamMemberFromApi(m)));
      setQuickCampaigns(
        campaigns.map((c: Record<string, unknown>) => mapQuickCampaignFromApi(c))
      );
      setUpcomingCampaigns(
        upcoming.map((c: Record<string, unknown>) => mapQuickCampaignFromApi(c))
      );

      const wa = whatsapp as { connected?: boolean } | null;
      setWhatsappConnected(Boolean(wa?.connected));

      const agentList = Array.isArray(agents) ? agents : [];
      const enabled = agentList.filter(
        (a: { isEnabled?: boolean }) => a.isEnabled !== false
      );
      setActiveAgents(enabled.length);
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
        className="mx-auto w-full max-w-[1400px] space-y-5 pb-10"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div className="h-10 w-48 rounded-lg skel animate-pulse" />
        <div className="h-14 rounded-xl border border-black/5 bg-surface animate-pulse" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`stat-skel-${i}`}
              className="relative overflow-hidden rounded-xl border border-black/5 bg-surface p-4 animate-pulse"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 skel" />
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-3 flex-1 pt-1">
                  <div className="h-3 w-24 rounded skel" />
                  <div className="h-8 w-20 rounded skel" />
                </div>
                <div className="h-10 w-10 rounded-xl skel shrink-0" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-black/5 bg-surface p-5 space-y-4 animate-pulse">
          <div className="flex items-center justify-between gap-3">
            <div className="h-4 w-44 rounded skel" />
            <div className="h-8 w-28 rounded-lg skel" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`upcoming-skel-${i}`} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl skel shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded skel" />
                  <div className="h-2.5 w-1/3 rounded skel" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3 rounded-xl border border-black/5 bg-surface p-5 space-y-4 animate-pulse">
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 w-48 rounded skel" />
              <div className="flex gap-2">
                <div className="h-8 w-12 rounded-lg skel" />
                <div className="h-8 w-12 rounded-lg skel" />
                <div className="h-8 w-12 rounded-lg skel" />
              </div>
            </div>
            <div className="h-56 rounded-xl skel" />
          </div>
          <div className="lg:col-span-2 rounded-xl border border-black/5 bg-surface p-5 space-y-4 animate-pulse">
            <div className="h-4 w-36 rounded skel" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`recent-skel-${i}`} className="space-y-2">
                  <div className="h-3 w-3/4 rounded skel" />
                  <div className="h-2.5 w-1/2 rounded skel" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/5 bg-surface p-5 space-y-4 animate-pulse">
          <div className="flex items-center justify-between gap-3">
            <div className="h-4 w-40 rounded skel" />
            <div className="h-8 w-24 rounded-lg skel" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`team-skel-${i}`} className="flex items-center gap-3 rounded-xl border border-black/5 p-3">
                <div className="h-10 w-10 rounded-full skel shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded skel" />
                  <div className="h-2.5 w-1/2 rounded skel" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-10">
      <OnboardingProfileBanner />

      <BottomStatusBar
        whatsappConnected={whatsappConnected}
        activeAgents={activeAgents}
        onNewCampaign={onNewCampaign}
        onNewJourney={onNewJourney}
        onAddContact={onAddContact}
        onImportCSV={onImportCSV}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          variant="contacts"
          icon={Users}
          value={contactsCount.toLocaleString()}
          label="Total contacts"
          trend="+8%"
        />

        <StatCard
          variant="messages"
          icon={Send}
          value={messagesCount.toLocaleString()}
          label="Messages today"
        />

        <StatCard
          variant="response"
          icon={Clock}
          value={
            <span>
              4m <span className="text-lg font-medium text-neutral-400">32s</span>
            </span>
          }
          label="Avg response time"
        />

        <StatCard
          variant="journeys"
          icon={Activity}
          value={journeysCount.toLocaleString()}
          label="Active journeys"
          badge={
            pausedJourneys > 0 ? (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
                {pausedJourneys} paused
              </span>
            ) : null
          }
        />
      </div>

      <UpcomingCampaignsPanel
        campaigns={upcomingCampaigns}
        onNewCampaign={onNewCampaign}
        onViewAll={() => navigate(pathForTab('campaigns'))}
        onOpenCampaign={(id) => navigate(pathForCampaign(id))}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-stretch">
        <div className="lg:col-span-3">
          <MessagePerformanceChart
            data={showChartEmpty ? [] : chartData}
            activeRange={chartRange}
            onRangeChange={setChartRange}
            onNewCampaign={onNewCampaign}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentCampaignsPanel
            campaigns={quickCampaigns}
            onNewCampaign={onNewCampaign}
            onViewAll={() => navigate(pathForTab('campaigns'))}
          />
        </div>
      </div>

      <TeamPerformanceSection
        members={teamMembers}
        onInvite={() => navigate(pathForSettingsSection('users'))}
        onViewReport={() => navigate(pathForTab('reports'))}
      />
    </div>
  );
};
