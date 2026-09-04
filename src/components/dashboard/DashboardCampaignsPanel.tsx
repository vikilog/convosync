import React, { useState } from 'react';
import { ArrowUpRight, Mail, MessageCircle, Plus } from 'lucide-react';
import type { QuickCampaign, QuickCampaignStatus } from '../../types';

interface DashboardCampaignsPanelProps {
  upcoming: QuickCampaign[];
  recent: QuickCampaign[];
  onNewCampaign: () => void;
  onViewAll?: () => void;
  onOpenCampaign?: (id: string) => void;
}

function statusPillClass(status: QuickCampaignStatus): string {
  switch (status) {
    case 'Completed':
      return 'bg-swiss-line/50 text-swiss-ink';
    case 'Running':
    case 'Active':
    case 'Scheduled':
      return 'bg-swiss-accent-soft text-swiss-accent';
    case 'Paused':
      return 'bg-swiss-line/50 text-swiss-muted';
    case 'Failed':
      return 'bg-red-50 text-red-600';
    case 'Draft':
      return 'bg-swiss-line/50 text-swiss-faint';
  }
}

function channelLabel(channel: QuickCampaign['channel']) {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'instagram') return 'Instagram';
  return 'Email';
}

function ChannelIcon({ channel }: { channel: QuickCampaign['channel'] }) {
  if (channel === 'whatsapp') return <MessageCircle className="h-4 w-4 text-channel-green" />;
  if (channel === 'instagram') return <MessageCircle className="h-4 w-4 text-pink-600" />;
  return <Mail className="h-4 w-4 text-sky-600" />;
}

function upcomingMeta(c: QuickCampaign): string {
  const when = c.scheduledAt
    ? new Date(c.scheduledAt).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Draft';
  return `${channelLabel(c.channel)} · ${when}`;
}

function recentMeta(c: QuickCampaign): string {
  return `${channelLabel(c.channel)} · ${c.date} · ${c.engagementMetric}`;
}

export const DashboardCampaignsPanel: React.FC<DashboardCampaignsPanelProps> = ({
  upcoming,
  recent,
  onNewCampaign,
  onViewAll,
  onOpenCampaign,
}) => {
  const upcomingItems = upcoming.slice(0, 4);
  const recentItems = recent.slice(0, 4);
  const isEmpty = upcomingItems.length === 0 && recentItems.length === 0;
  const [tab, setTab] = useState<'upcoming' | 'recent'>('upcoming');
  const activeItems = (tab === 'upcoming' ? upcomingItems : recentItems).map((c) => ({
    campaign: c,
    meta: tab === 'upcoming' ? upcomingMeta(c) : recentMeta(c),
  }));

  return (
    <div className="flex h-full flex-col font-swiss">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[13.5px] font-bold text-swiss-ink">Campaigns</p>
        <button
          type="button"
          onClick={onNewCampaign}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-swiss-accent px-3 py-1.5 text-[11.5px] font-semibold text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      <div className="mb-1 flex gap-4 border-b border-swiss-line">
        <button
          type="button"
          onClick={() => setTab('upcoming')}
          className={`cursor-pointer pb-2 text-[12px] font-semibold ${
            tab === 'upcoming'
              ? 'border-b-2 border-swiss-accent text-swiss-ink'
              : 'text-swiss-faint'
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => setTab('recent')}
          className={`cursor-pointer pb-2 text-[12px] font-semibold ${
            tab === 'recent' ? 'border-b-2 border-swiss-accent text-swiss-ink' : 'text-swiss-faint'
          }`}
        >
          Recent
        </button>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium text-swiss-ink">No campaigns yet</p>
          <button
            type="button"
            onClick={onNewCampaign}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-swiss-accent"
          >
            <Plus className="h-4 w-4" />
            Start your first campaign
          </button>
        </div>
      ) : activeItems.length === 0 ? (
        <p className="flex-1 py-6 text-center text-[12px] text-swiss-muted">
          No {tab} campaigns.
        </p>
      ) : (
        <div className="flex-1 divide-y divide-swiss-line">
          {activeItems.map(({ campaign, meta }) => (
            <button
              key={campaign.id}
              type="button"
              onClick={() => onOpenCampaign?.(campaign.id)}
              className="flex w-full cursor-pointer items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0"
            >
              <ChannelIcon channel={campaign.channel} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-swiss-ink">{campaign.name}</p>
                <p className="text-[11px] text-swiss-muted">{meta}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusPillClass(campaign.status)}`}
              >
                {campaign.status}
              </span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onViewAll}
        className="mt-3 inline-flex cursor-pointer items-center justify-center gap-1 text-[11.5px] font-semibold text-swiss-accent"
      >
        View all campaigns
        <ArrowUpRight className="h-3 w-3" />
      </button>
    </div>
  );
};
