import React from 'react';
import { ArrowUpRight, CalendarClock, Mail, MessageCircle, Plus, Users } from 'lucide-react';
import type { QuickCampaign, QuickCampaignStatus } from '../../types';

interface UpcomingCampaignsPanelProps {
  campaigns: QuickCampaign[];
  onNewCampaign: () => void;
  onViewAll?: () => void;
  onOpenCampaign?: (id: string) => void;
}

function statusClass(status: QuickCampaignStatus): string {
  switch (status) {
    case 'Scheduled':
      return 'text-violet-700 bg-violet-50';
    case 'Draft':
      return 'text-slate-600 bg-slate-100';
    case 'Paused':
      return 'text-amber-700 bg-amber-50';
    default:
      return 'text-sky-700 bg-sky-50';
  }
}

function channelLabel(channel: QuickCampaign['channel']) {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'instagram') return 'Instagram';
  return 'Email';
}

function channelIconClass(channel: QuickCampaign['channel']) {
  if (channel === 'whatsapp') return 'bg-[#e6f7ec] text-channel-green';
  if (channel === 'instagram') return 'bg-pink-50 text-pink-600';
  return 'bg-sky-50 text-sky-600';
}

function ChannelIcon({ channel }: { channel: QuickCampaign['channel'] }) {
  const cls = `h-4 w-4 ${channel === 'whatsapp' ? 'text-channel-green' : channel === 'instagram' ? 'text-pink-600' : 'text-sky-600'}`;
  if (channel === 'whatsapp') return <MessageCircle className={cls} />;
  return <Mail className={cls} />;
}

function formatSchedule(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timingLabel(campaign: QuickCampaign): string {
  if (campaign.scheduledAt) {
    const scheduled = new Date(campaign.scheduledAt);
    if (scheduled.getTime() > Date.now()) {
      return formatSchedule(campaign.scheduledAt);
    }
  }
  if (campaign.status === 'Draft') return 'Draft · not scheduled';
  return `Created ${campaign.date}`;
}

export const UpcomingCampaignsPanel: React.FC<UpcomingCampaignsPanelProps> = ({
  campaigns,
  onNewCampaign,
  onViewAll,
  onOpenCampaign,
}) => (
  <section className="rounded-xl border border-black/5 bg-surface p-5">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="font-display text-lg font-medium text-neutral-900">Upcoming campaigns</h2>
        <p className="text-sm text-neutral-500">Scheduled and draft campaigns ready to send</p>
      </div>
      <button
        type="button"
        onClick={onViewAll}
        className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
      >
        View all
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </div>

    {campaigns.length === 0 ? (
      <div className="rounded-lg border border-dashed border-black/10 py-10 text-center">
        <CalendarClock className="mx-auto h-8 w-8 text-neutral-300" />
        <p className="mt-3 text-sm font-medium text-neutral-800">No upcoming campaigns</p>
        <p className="mt-1 text-sm text-neutral-500">Schedule a campaign or save one as draft.</p>
        <button
          type="button"
          onClick={onNewCampaign}
          className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover"
        >
          <Plus className="h-4 w-4" />
          Create campaign
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {campaigns.map((campaign) => (
          <button
            key={campaign.id}
            type="button"
            onClick={() => onOpenCampaign?.(campaign.id)}
            className="flex cursor-pointer flex-col rounded-xl border border-black/5 bg-black/[0.03] p-4 text-left transition-colors hover:border-primary/25 hover:bg-white/60"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${channelIconClass(campaign.channel)}`}
              >
                <ChannelIcon channel={campaign.channel} />
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${statusClass(campaign.status)}`}
              >
                {campaign.status}
              </span>
            </div>

            <p className="mt-3 line-clamp-2 text-sm font-semibold text-neutral-900">{campaign.name}</p>

            <p className="mt-1 text-xs text-neutral-500">{channelLabel(campaign.channel)}</p>

            <div className="mt-4 flex items-center gap-3 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5 text-neutral-400" />
                {timingLabel(campaign)}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-neutral-600">
              <Users className="h-3.5 w-3.5 text-neutral-400" />
              {Number(campaign.audienceCount).toLocaleString()} recipients
            </div>
          </button>
        ))}
      </div>
    )}
  </section>
);
