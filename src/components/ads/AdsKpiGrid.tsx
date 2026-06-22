import React from 'react';
import { DollarSign, MessageSquare, MousePointerClick, TrendingUp } from 'lucide-react';
import { fmt, fmtInr, fmtPct } from './utils';

type KpiStat = {
  label: string;
  value: string;
  delta: string;
  icon: React.ReactNode;
  color: string;
};

export const AdsKpiGrid: React.FC<{ stats: KpiStat[] }> = ({ stats }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((stat) => (
      <div
        key={stat.label}
        className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-100 transition-colors"
      >
        <div className={`${stat.color} w-8 h-8 rounded-xl flex items-center justify-center mb-2`}>
          {stat.icon}
        </div>
        <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest leading-none mb-1">
          {stat.label}
        </p>
        <p className="text-2xl font-black text-gray-900 font-mono">{stat.value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{stat.delta}</p>
      </div>
    ))}
  </div>
);

export function buildAdsKpiStats(input: {
  totalSpend: number;
  totalClicks: number;
  totalConversations: number;
  avgCTR: number;
  platformLabel: string;
}): KpiStat[] {
  return [
    {
      label: 'Total Spend',
      value: fmtInr(input.totalSpend),
      delta: input.platformLabel,
      icon: <DollarSign className="w-4 h-4" />,
      color: 'text-sky-600 bg-sky-50',
    },
    {
      label: 'Total Clicks',
      value: fmt(input.totalClicks),
      delta: 'Across connected ads',
      icon: <MousePointerClick className="w-4 h-4" />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'WA Conversations',
      value: fmt(input.totalConversations),
      delta: 'Meta CTWA only',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'text-green-700 bg-green-50',
    },
    {
      label: 'Avg CTR',
      value: fmtPct(input.avgCTR),
      delta: 'Industry avg 1.2%',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-pink-600 bg-pink-50',
    },
  ];
}
