import React from 'react';
import { ArrowUpRight, Mail, MessageCircle, Plus } from 'lucide-react';
import type { QuickCampaign, QuickCampaignStatus } from '../../types';

interface RecentCampaignsPanelProps {
  campaigns: QuickCampaign[];
  onNewCampaign: () => void;
  onViewAll?: () => void;
}

function statusClass(status: QuickCampaignStatus): string {
  switch (status) {
    case 'Completed':
      return 'text-emerald-700 bg-emerald-50';
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

function ChannelIcon({ channel }: { channel: QuickCampaign['channel'] }) {
  if (channel === 'whatsapp') {
    return <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />;
  }
  return <Mail className="h-3.5 w-3.5 text-sky-600" />;
}

function channelLabel(channel: QuickCampaign['channel']) {
  if (channel === 'whatsapp') return 'WhatsApp';
  if (channel === 'instagram') return 'Instagram';
  return 'Email';
}

export const RecentCampaignsPanel: React.FC<RecentCampaignsPanelProps> = ({
  campaigns,
  onNewCampaign,
  onViewAll,
}) => {
  const items = campaigns.slice(0, 4);

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-5 ring-1 ring-slate-200/80">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Recent campaigns</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <p className="text-sm font-medium text-slate-800">No campaigns yet</p>
          <button
            type="button"
            onClick={onNewCampaign}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            <Plus className="h-4 w-4" />
            Start your first campaign
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((campaign) => {
            const sent = campaign.sentCount || Number(campaign.audienceCount) || 0;
            const delivered = campaign.deliveredCount || 0;
            const pct = sent > 0 ? Math.round((delivered / sent) * 100) : 0;

            return (
              <li key={campaign.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                  <ChannelIcon channel={campaign.channel} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{campaign.name}</p>
                  <p className="text-xs text-slate-500">
                    {campaign.date} · {channelLabel(campaign.channel)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${statusClass(campaign.status)}`}
                  >
                    {campaign.status}
                  </span>
                  <p className="mt-1 text-xs tabular-nums text-slate-500">{pct}% delivered</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
