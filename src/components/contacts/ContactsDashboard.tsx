/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserX,
  Ban,
  MessageCircle,
  Instagram,
  Facebook,
  Tag,
  Mail,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { api } from '../../lib/api';
import { ThemeDateInput } from './ThemeDateInput';

export type ContactDashboardStats = {
  all: number;
  unsubscribe: number;
  blocklist: number;
  withEmail: number;
  channels: { whatsapp: number; instagram: number; messenger: number };
  sources: { source: string; count: number }[];
  topTags: { tag: string; count: number }[];
};

type GrowthRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

type GrowthPoint = { date: string; count: number; label: string };

const GROWTH_RANGES: { id: GrowthRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'custom', label: 'Custom' },
];

const CHANNEL_COLORS = {
  whatsapp: '#064e3b',
  instagram: '#0a5c46',
  messenger: '#0d6b52',
};

const SOURCE_COLORS = [
  '#064e3b',
  '#0a5c46',
  '#0d6b52',
  '#14805f',
  '#2a9a74',
  '#4aad8c',
  '#6bbfa5',
  '#8fd0bb',
];

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {value.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      </div>
    </div>
  );
}

function rangeHint(range: GrowthRange): string {
  switch (range) {
    case 'today':
      return 'Hourly · today';
    case 'yesterday':
      return 'Hourly · yesterday';
    case 'week':
      return 'Daily · this week (Mon–today)';
    case 'month':
      return 'Daily · this calendar month';
    case 'custom':
      return 'Daily · selected range';
  }
}

export const ContactsDashboard: React.FC<{
  connectedChannels?: Array<'whatsapp' | 'instagram' | 'messenger'>;
}> = ({ connectedChannels }) => {
  const [stats, setStats] = useState<ContactDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [growthRange, setGrowthRange] = useState<GrowthRange>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [growthPoints, setGrowthPoints] = useState<GrowthPoint[]>([]);
  const [growthTotal, setGrowthTotal] = useState(0);
  const [growthLoading, setGrowthLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getContactStats()
      .then((raw) => {
        if (cancelled) return;
        setStats(raw as ContactDashboardStats);
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (growthRange === 'custom' && (!customFrom || !customTo)) {
      setGrowthPoints([]);
      setGrowthTotal(0);
      return;
    }
    let cancelled = false;
    setGrowthLoading(true);
    const params: Record<string, string> = {
      range: growthRange,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    };
    if (growthRange === 'custom') {
      params.dateFrom = customFrom;
      params.dateTo = customTo;
    }
    api
      .getContactGrowth(params)
      .then((res) => {
        if (cancelled) return;
        setGrowthPoints(res.createdByDay ?? []);
        setGrowthTotal(res.total ?? 0);
      })
      .catch(() => {
        if (cancelled) return;
        setGrowthPoints([]);
        setGrowthTotal(0);
      })
      .finally(() => {
        if (!cancelled) setGrowthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [growthRange, customFrom, customTo]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Loading dashboard…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-sm text-red-600">
        {error || 'No stats available'}
      </div>
    );
  }

  const connected = new Set(connectedChannels ?? ['whatsapp', 'instagram', 'messenger']);

  const channelPie = (
    [
      { id: 'whatsapp' as const, name: 'WhatsApp', value: stats.channels.whatsapp, color: CHANNEL_COLORS.whatsapp },
      { id: 'instagram' as const, name: 'Instagram', value: stats.channels.instagram, color: CHANNEL_COLORS.instagram },
      { id: 'messenger' as const, name: 'Messenger', value: stats.channels.messenger, color: CHANNEL_COLORS.messenger },
    ] as const
  ).filter((c) => connected.has(c.id) && c.value > 0);

  const channelLegend = (
    [
      { id: 'whatsapp' as const, name: 'WhatsApp', value: stats.channels.whatsapp, icon: MessageCircle },
      { id: 'instagram' as const, name: 'Instagram', value: stats.channels.instagram, icon: Instagram },
      { id: 'messenger' as const, name: 'Messenger', value: stats.channels.messenger, icon: Facebook },
    ] as const
  ).filter((c) => connected.has(c.id));

  const channelSubtitle = channelLegend.map((c) => c.name).join(' · ') || 'No channels';

  const sourceData = stats.sources.map((s, i) => ({
    name: s.source,
    count: s.count,
    fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }));

  const customReady = growthRange !== 'custom' || (Boolean(customFrom) && Boolean(customTo));

  return (
    <div className="h-full min-h-0 overflow-auto bg-surface-muted p-3 md:p-4 space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total contacts" value={stats.all} icon={<Users className="h-4 w-4" />} />
        <StatCard
          label="With email"
          value={stats.withEmail}
          icon={<Mail className="h-4 w-4" />}
        />
        {connected.has('whatsapp') && (
          <StatCard
            label="WhatsApp"
            value={stats.channels.whatsapp}
            icon={<MessageCircle className="h-4 w-4" />}
          />
        )}
        {connected.has('instagram') && (
          <StatCard
            label="Instagram"
            value={stats.channels.instagram}
            icon={<Instagram className="h-4 w-4" />}
          />
        )}
        {connected.has('messenger') && (
          <StatCard
            label="Messenger"
            value={stats.channels.messenger}
            icon={<Facebook className="h-4 w-4" />}
          />
        )}
        <StatCard
          label="Unsubscribed"
          value={stats.unsubscribe}
          icon={<UserX className="h-4 w-4" />}
        />
        <StatCard label="Blocklist" value={stats.blocklist} icon={<Ban className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2 rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 shrink-0">
              <h3 className="text-sm font-bold text-slate-900">New contacts</h3>
              <p className="text-xs text-slate-500">{rangeHint(growthRange)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex flex-wrap rounded-lg border border-primary/15 bg-black/[0.03] p-0.5">
                {GROWTH_RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setGrowthRange(r.id)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      growthRange === r.id
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-slate-600 hover:text-primary'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {growthRange === 'custom' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <ThemeDateInput
                    value={customFrom}
                    onChange={setCustomFrom}
                    aria-label="Growth from"
                    placeholder="From"
                    max={customTo || undefined}
                  />
                  <ThemeDateInput
                    value={customTo}
                    onChange={setCustomTo}
                    aria-label="Growth to"
                    placeholder="To"
                    min={customFrom || undefined}
                  />
                </div>
              )}
              <p className="text-sm font-bold tabular-nums text-primary">
                +{growthTotal.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="h-[220px] w-full">
            {growthLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading…
              </div>
            ) : !customReady ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Pick a from and to date
              </div>
            ) : growthTotal === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No new contacts in this range
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="contactGrowthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#064e3b" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#064e3b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e2dc" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid rgba(6,78,59,0.15)',
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="New"
                    stroke="#064e3b"
                    strokeWidth={2}
                    fill="url(#contactGrowthFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
          <h3 className="text-sm font-bold text-slate-900">By channel</h3>
          <p className="mb-2 text-xs text-slate-500">{channelSubtitle}</p>
          <div className="h-[180px] w-full">
            {channelPie.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No channel data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[...channelPie]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {channelPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.06)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {channelLegend.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <c.icon className="h-3.5 w-3.5 text-primary" />
                <span>{c.name}</span>
                <span className="font-semibold text-slate-800">{c.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
          <h3 className="text-sm font-bold text-slate-900">Top sources</h3>
          <p className="mb-3 text-xs text-slate-500">Where contacts came from</p>
          <div className="h-[200px] w-full">
            {sourceData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No source data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sourceData}
                  layout="vertical"
                  margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e2dc" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={88}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid rgba(6,78,59,0.15)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" name="Contacts" radius={[0, 6, 6, 0]}>
                    {sourceData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top tags</h3>
              <p className="text-xs text-slate-500">Most used labels</p>
            </div>
          </div>
          {stats.topTags.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
              No tags yet
            </div>
          ) : (
            <ul className="space-y-2">
              {stats.topTags.map((t) => {
                const pct = stats.all > 0 ? Math.round((t.count / stats.all) * 100) : 0;
                return (
                  <li key={t.tag}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800 truncate">{t.tag}</span>
                      <span className="tabular-nums text-slate-500">
                        {t.count.toLocaleString()} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
