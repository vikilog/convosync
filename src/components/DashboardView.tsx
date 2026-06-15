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
  const [planName, setPlanName] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const [activeAgents, setActiveAgents] = useState(0);

  const contactsCount = useCountUp(totalContacts, 1000);
  const messagesCount = useCountUp(messagesToday, 1000);
  const journeysCount = useCountUp(activeJourneys, 1000);

  const chartData = useMemo(() => {
    return normalizeChartData(performanceData, chartRange);
  }, [performanceData, chartRange]);

  const showChartEmpty = useMemo(() => isChartEmpty(chartData), [chartData]);

  const loadDashboard = useCallback(async () => {
    try {
      const [stats, chart, team, campaigns, upcoming, whatsapp, company, agents] =
        await Promise.all([
          api.getDashboardStats(),
          api.getMessageChart(chartRange),
          api.getTeamStats(),
          api.getRecentCampaigns(),
          api.getUpcomingCampaigns(),
          api.getWhatsAppStatus().catch(() => null),
          api.getCompanySettings().catch(() => null),
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

      const trial = (company as { trial?: { isTrial?: boolean; trialDaysLeft?: number; planName?: string } })
        ?.trial;
      setIsTrial(Boolean(trial?.isTrial));
      setTrialDaysLeft(trial?.trialDaysLeft ?? null);
      setPlanName(trial?.planName ?? 'Starter Plan');

      const agentList = Array.isArray(agents) ? agents : [];
      const enabled = agentList.filter(
        (a: { isEnabled?: boolean }) => a.isEnabled !== false
      );
      setActiveAgents(enabled.length);
    } catch (err) {
      console.error(err);
    }
  }, [chartRange]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useKeepAliveActivation(() => {
    void loadDashboard();
  });

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5 pb-10">
      <OnboardingProfileBanner />

      <BottomStatusBar
        whatsappConnected={whatsappConnected}
        planName={planName}
        isTrial={isTrial}
        trialDaysLeft={trialDaysLeft}
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
              4m <span className="text-lg font-medium text-slate-400">32s</span>
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
