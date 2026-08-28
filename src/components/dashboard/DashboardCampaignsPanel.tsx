import React from 'react';
import { ArrowUpRight, Mail, MessageCircle, Plus } from 'lucide-react';
import type { QuickCampaign, QuickCampaignStatus } from '../../types';

interface DashboardCampaignsPanelProps {
  upcoming: QuickCampaign[];
  recent: QuickCampaign[];
  onNewCampaign: () => void;
  onViewAll?: () => void;
  onOpenCampaign?: (id: string) => void;
}

function statusClass(status: QuickCampaignStatus): string {
  switch (status) {
    case 'Completed':
      return 'text-swiss-ink';
    case 'Running':
    case 'Active':
    case 'Scheduled':
      return 'text-swiss-accent';
    case 'Paused':
      return 'text-swiss-muted';
    case 'Failed':
      return 'text-red-600';
    case 'Draft':
      return 'text-swiss-faint';
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
  const upcomingItems = upcoming.slice(0, 2);
  const recentItems = recent.slice(0, 3);
  const isEmpty = upcomingItems.length === 0 && recentItems.length === 0;

  return (
    <div className="flex h-full flex-col font-swiss">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-swiss-muted">
          Campaigns
        </p>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-swiss-accent"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
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
      ) : (
        <div className="divide-y divide-swiss-line">
          {[
            ...upcomingItems.map((c) => ({ campaign: c, meta: upcomingMeta(c) })),
            ...recentItems.map((c) => ({ campaign: c, meta: recentMeta(c) })),
          ].map(({ campaign, meta }) => (
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
                className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${statusClass(campaign.status)}`}
              >
                {campaign.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
