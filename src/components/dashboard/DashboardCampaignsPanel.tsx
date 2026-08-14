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
      return 'text-primary bg-[#e8f0ec]';
    case 'Running':
    case 'Active':
      return 'text-sky-700 bg-sky-50';
    case 'Paused':
      return 'text-amber-700 bg-amber-50';
    case 'Failed':
      return 'text-red-700 bg-red-50';
    case 'Draft':
      return 'text-slate-600 bg-slate-100';
    case 'Scheduled':
      return 'text-violet-700 bg-violet-50';
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
    <div className="flex h-full flex-col rounded-xl bg-white p-5 ring-1 ring-slate-200/80">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-neutral-900">Campaigns</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover active:scale-[0.97]"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-3 text-sm text-neutral-500">Upcoming and recently sent</p>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium text-neutral-800">No campaigns yet</p>
          <button
            type="button"
            onClick={onNewCampaign}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover active:scale-[0.97]"
          >
            <Plus className="h-4 w-4" />
            Start your first campaign
          </button>
        </div>
      ) : (
        <div className="divide-y divide-black/5">
          {[
            ...upcomingItems.map((c) => ({ campaign: c, meta: upcomingMeta(c) })),
            ...recentItems.map((c) => ({ campaign: c, meta: recentMeta(c) })),
          ].map(({ campaign, meta }) => (
            <button
              key={campaign.id}
              type="button"
              onClick={() => onOpenCampaign?.(campaign.id)}
              className="flex w-full cursor-pointer items-center gap-3 py-3 text-left transition-colors first:pt-0 last:pb-0 hover:bg-black/[0.02]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted">
                <ChannelIcon channel={campaign.channel} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{campaign.name}</p>
                <p className="text-xs text-neutral-500">{meta}</p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${statusClass(campaign.status)}`}
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
