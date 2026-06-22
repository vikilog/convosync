import React, { useState } from 'react';
import {
  BarChart2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  MessageSquare,
  MousePointerClick,
  Pause,
  Percent,
  Play,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { AdCampaign, AdInsights } from '../../types';
import { GoogleIcon } from './GoogleIcon';
import { AdPlatformSource, STATUS_STYLES, fmt, fmtInr, fmtPct } from './utils';

const InsightsRow: React.FC<{
  insights: AdInsights;
  isCTWA: boolean;
  waConversations?: number;
}> = ({ insights, isCTWA, waConversations }) => {
  const metrics = [
    { label: 'Spend', value: fmtInr(insights.spend), icon: <DollarSign className="w-3.5 h-3.5" />, color: 'text-purple-600 bg-purple-50' },
    { label: 'Impressions', value: fmt(insights.impressions), icon: <Eye className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Clicks', value: fmt(insights.clicks), icon: <MousePointerClick className="w-3.5 h-3.5" />, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'CTR', value: fmtPct(insights.ctr), icon: <Percent className="w-3.5 h-3.5" />, color: 'text-pink-600 bg-pink-50' },
    { label: 'CPC', value: fmtInr(insights.cpc), icon: <Target className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-50' },
    { label: 'CPM', value: fmtInr(insights.cpm), icon: <BarChart2 className="w-3.5 h-3.5" />, color: 'text-gray-600 bg-gray-100' },
    ...(isCTWA
      ? [{ label: 'WA Convos', value: fmt(waConversations || 0), icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'text-green-700 bg-green-50' }]
      : []),
    ...(insights.roas
      ? [{ label: 'ROAS', value: `${insights.roas}x`, icon: <TrendingUp className="w-3.5 h-3.5" />, color: 'text-emerald-600 bg-emerald-50' }]
      : []),
  ];

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-3 pt-3 border-t border-slate-200">
      {metrics.map((m) => (
        <div key={m.label} className="text-center">
          <div className={`${m.color} w-6 h-6 rounded-lg flex items-center justify-center mx-auto mb-1`}>
            {m.icon}
          </div>
          <p className="text-sm font-black text-gray-900 font-mono">{m.value}</p>
          <p className="text-meta text-gray-500 font-medium">{m.label}</p>
        </div>
      ))}
    </div>
  );
};

export type CampaignWithSource = AdCampaign & { source: AdPlatformSource };

export const CampaignCard: React.FC<{
  campaign: CampaignWithSource;
  onToggle?: (id: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  busy?: boolean;
  readOnly?: boolean;
}> = ({ campaign, onToggle, onDelete, busy, readOnly }) => {
  const [showInsights, setShowInsights] = useState(false);
  const isGoogle = campaign.source === 'google';
  const managerHref = isGoogle
    ? 'https://ads.google.com/aw/campaigns'
    : `https://business.facebook.com/adsmanager/manage/campaigns?act=${campaign.id.split('_')[0]}`;

  return (
    <article
      className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 ${
        campaign.status === 'PAUSED'
          ? 'border-yellow-200 opacity-90'
          : 'border-slate-200 hover:border-sky-200 hover:shadow-md'
      }`}
    >
      <div className="h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden">
        {campaign.previewUrl ? (
          <img src={campaign.previewUrl} alt={campaign.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-300">
            <ImageIcon className="w-8 h-8" />
            <span className="text-sm font-bold uppercase tracking-wider">{campaign.platform}</span>
          </div>
        )}
        <span className="absolute bottom-3 left-3 bg-slate-900/80 text-white text-meta font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md">
          {isGoogle ? 'Google Ads' : campaign.platform}
        </span>
        <span
          className={`absolute top-3 right-3 text-meta font-black px-2.5 py-1 rounded-full border ${STATUS_STYLES[campaign.status] || STATUS_STYLES.PAUSED}`}
        >
          {campaign.status}
        </span>
        {campaign.isCTWA && (
          <span className="absolute top-3 left-3 bg-[#25D366] text-white text-meta font-black px-2 py-0.5 rounded-full flex items-center gap-1">
            <MessageSquare className="w-2.5 h-2.5" /> CTWA
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h5 className="font-bold text-gray-900 text-sm leading-tight">{campaign.name}</h5>
          <p className="text-xs text-gray-500 font-medium mb-3 mt-1">
            {campaign.objective} • {fmtInr(campaign.dailyBudget)}/day • Started {campaign.startTime}
          </p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <p className="text-meta text-gray-500 font-black uppercase">Clicks</p>
              <p className="text-sm font-black text-gray-900 font-mono mt-0.5">{fmt(campaign.clicks)}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-center">
              <p className="text-meta text-sky-600 font-black uppercase">Conv%</p>
              <p className="text-sm font-black text-sky-600 font-mono mt-0.5">{campaign.conversionMultiplier}%</p>
            </div>
            <div
              className={`p-2 rounded-xl border text-center ${
                campaign.isCTWA ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'
              }`}
            >
              <p className={`text-meta font-black uppercase ${campaign.isCTWA ? 'text-green-600' : 'text-gray-500'}`}>
                {campaign.isCTWA ? 'WA Convos' : 'Reach'}
              </p>
              <p className={`text-sm font-black font-mono mt-0.5 ${campaign.isCTWA ? 'text-green-700' : 'text-gray-900'}`}>
                {campaign.isCTWA
                  ? fmt(campaign.waConversationsStarted || 0)
                  : fmt(campaign.insights.reach)}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowInsights(!showInsights)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors cursor-pointer mb-3"
        >
          <span className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5" /> View Analytics
          </span>
          {showInsights ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showInsights && (
          <InsightsRow
            insights={campaign.insights}
            isCTWA={campaign.isCTWA}
            waConversations={campaign.waConversationsStarted}
          />
        )}

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between mt-3 gap-2">
          {!readOnly && onToggle && onDelete ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void onToggle(campaign.id)}
                className={`flex items-center gap-1.5 text-sm font-black px-3 py-1.5 rounded-xl border transition-colors cursor-pointer disabled:opacity-50 ${
                  campaign.status === 'ACTIVE'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                }`}
              >
                {campaign.status === 'ACTIVE' ? (
                  <>
                    <Pause className="w-3 h-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> Resume
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDelete(campaign.id)}
                className="flex items-center gap-1.5 text-sm font-black px-3 py-1.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          ) : (
            <span className="text-xs text-gray-500 font-medium">Manage in Google Ads</span>
          )}
          <a
            href={managerHref}
            target="_blank"
            rel="noreferrer"
            className="text-sky-600 hover:text-sky-700 p-1.5 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1 text-meta font-black shrink-0"
          >
            {isGoogle ? (
              <>
                <GoogleIcon className="w-3.5 h-3.5" /> Google Ads
              </>
            ) : (
              <>Meta Ads <ExternalLink className="w-3.5 h-3.5" /></>
            )}
          </a>
        </div>
      </div>
    </article>
  );
};
