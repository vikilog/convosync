/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  Bot,
  Calendar,
  ChevronDown,
  Cpu,
  Download,
  Info,
  Loader2,
  Mail,
  MessageCircle,
  Receipt,
} from 'lucide-react';
import { api } from '../lib/api';

function formatInr(value: number, decimals = 2): string {
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function formatCount(value: number): string {
  return value.toLocaleString('en-IN');
}

type SummaryCardProps = {
  bg: string;
  border: string;
  iconBg: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  badge?: React.ReactNode;
  sub?: string;
};

function SummaryCard({
  bg,
  border,
  iconBg,
  iconColor,
  icon: Icon,
  label,
  value,
  badge,
  sub,
}: SummaryCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border-l-4 p-4 transition-shadow hover:shadow-md"
      style={{ backgroundColor: bg, borderLeftColor: border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            {badge}
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
        </div>
      </div>
    </div>
  );
}

type UsageCostResponse = {
  month: string;
  summary: {
    totalCostInr: number;
    costChangePct: number;
    whatsappMessagesSent: number;
    whatsappCostInr: number;
    aiTokensUsed: number;
    aiCostInr: number;
    emailsSent: number;
    emailCostInr: number;
  };
  whatsapp: {
    rows: Array<{
      key: string;
      label: string;
      dot: string;
      badge: string;
      chartColor: string;
      conversations: number;
      rate: string;
      grossCost: number;
      billedCost: number;
    }>;
    grossCostInr: number;
    billedCostInr: number;
    totalConversations: number;
  };
  ai: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    inputRateInrPer1k: number;
    outputRateInrPer1k: number;
    grossCostInr: number;
    includedTokens: number;
    includedCreditInr: number;
    billedCostInr: number;
    dailyTokens: Array<{ day: number; tokens: number }>;
    agents: Array<{ agentId: string; name: string; tokens: number; pct: number }>;
    quotaPct: number;
  };
  email: {
    sent: number;
    included: number;
    billedCostInr: number;
  };
};

function buildMonthOptions(count = 6): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    return { value, label };
  });
}

function WhatsAppPieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; count: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-slate-900">{row.name}</p>
      <p className="mt-1 text-slate-600">{formatInr(row.value)}</p>
      <p className="text-slate-500">{formatCount(row.count)} conversations</p>
    </div>
  );
}

function DailyTokensTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { day: number; tokens: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md">
      Day {row.day}: {formatCount(row.tokens)} tokens
    </div>
  );
}

const AGENT_BAR_COLORS = ['bg-blue-500', 'bg-sky-500', 'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500'];

export const UsageCost: React.FC = () => {
  const monthOptions = useMemo(() => buildMonthOptions(6), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value ?? '');
  const [data, setData] = useState<UsageCostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.getUsageCost(month)) as UsageCostResponse;
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMonth) void load(selectedMonth);
  }, [selectedMonth, load]);

  const selectedMonthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label ?? monthOptions[0]?.label;

  const pieData = useMemo(() => {
    if (!data) return [];
    return data.whatsapp.rows
      .filter((r) => r.billedCost > 0)
      .map((r) => ({
        name: r.label,
        value: r.billedCost,
        count: r.conversations,
        color: r.chartColor,
      }));
  }, [data]);

  const pieLegend = useMemo(() => {
    const total = pieData.reduce((s, d) => s + d.value, 0);
    return pieData.map((d) => ({
      ...d,
      pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
    }));
  }, [pieData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl pb-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Could not load usage data'}
        </div>
      </div>
    );
  }

  const { summary, whatsapp, ai } = data;
  const totalConversations = whatsapp.rows.reduce((s, r) => s + r.conversations, 0);
  const grossWhatsAppCost = whatsapp.grossCostInr;
  const whatsappBilledTotal = whatsapp.billedCostInr;
  const costChange = summary.costChangePct;
  const costChangeUp = costChange >= 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Usage &amp; Cost</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Track your messaging, AI, and email usage with real-time cost breakdown.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Select billing month"
              disabled={loading}
              className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-slate-300 focus:border-channel-green focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          bg="#FFF7ED"
          border="#F97316"
          iconBg="#FFEDD5"
          iconColor="#EA580C"
          icon={Receipt}
          label="Total Cost This Month"
          value={formatInr(summary.totalCostInr)}
          badge={
            costChange !== 0 ? (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  costChangeUp ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {costChangeUp ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                {Math.abs(costChange)}% vs last month
              </span>
            ) : undefined
          }
        />
        <SummaryCard
          bg="#F0FDF4"
          border="#10B981"
          iconBg="#DCFCE7"
          iconColor="#059669"
          icon={MessageCircle}
          label="WhatsApp Messages Sent"
          value={formatCount(summary.whatsappMessagesSent)}
          sub={`${formatInr(summary.whatsappCostInr)} charged`}
        />
        <SummaryCard
          bg="#EFF6FF"
          border="#3B82F6"
          iconBg="#DBEAFE"
          iconColor="#2563EB"
          icon={Cpu}
          label="AI Tokens Used"
          value={formatCount(summary.aiTokensUsed)}
          sub={`${formatInr(summary.aiCostInr)} charged`}
        />
        <SummaryCard
          bg="#FAF5FF"
          border="#8B5CF6"
          iconBg="#F3E8FF"
          iconColor="#7C3AED"
          icon={Mail}
          label="Emails Sent"
          value={formatCount(summary.emailsSent)}
          sub={`${formatInr(summary.emailCostInr)} charged`}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-[#128C7E]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">WhatsApp Messaging Cost</h2>
              <p className="text-xs text-slate-500">Meta conversation charges breakdown</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-lg font-bold text-[#0F172A]">{formatInr(whatsappBilledTotal)}</p>
            <p className="text-[11px] text-slate-400">{selectedMonthLabel}</p>
          </div>
        </div>

        <div className="mt-4 mb-4 flex gap-2.5 rounded-lg bg-[#EFF6FF] p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
          <p className="text-xs leading-relaxed text-[#374151]">
            WhatsApp charges per conversation (24-hour window), not per message. Conversation counts
            are estimated from outbound message activity grouped by contact, type, and day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Type', 'Conversations', 'Rate', 'Cost'].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {whatsapp.rows.map((row) => (
                  <tr key={row.key} className="border-b border-slate-50">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${row.dot}`} />
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${row.badge}`}
                        >
                          {row.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-slate-700">
                      {formatCount(row.conversations)}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">{row.rate}</td>
                    <td className="py-2.5 tabular-nums font-medium text-slate-900">
                      {formatInr(row.billedCost)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="pt-3 pr-3 font-bold text-slate-900">Total</td>
                  <td className="pt-3 pr-3 font-bold tabular-nums text-slate-900">
                    {formatCount(totalConversations)}
                  </td>
                  <td className="pt-3 pr-3 text-slate-400">—</td>
                  <td className="pt-3 font-bold tabular-nums text-slate-900">
                    {formatInr(grossWhatsAppCost)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              * Service conversations are free within 1000/month. After that ₹0.12/conv
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Billed amount for {selectedMonthLabel}: {formatInr(whatsappBilledTotal)} (after free
              tier &amp; credits)
            </p>
          </div>

          <div className="flex flex-col items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <div className="relative h-[220px] w-full max-w-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<WhatsAppPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-900">
                        {formatInr(whatsappBilledTotal, 0)}
                      </p>
                      <p className="text-[11px] text-slate-500">Total</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex w-full max-w-sm flex-wrap justify-center gap-x-4 gap-y-2">
                  {pieLegend.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                      <span className="font-semibold text-slate-800">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-12 text-sm text-slate-400">No billable WhatsApp usage this month</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">AI Agent Token Usage</h2>
              <p className="text-xs text-slate-500">OpenAI consumption and estimated cost</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-lg font-bold text-[#0F172A]">{formatInr(ai.billedCostInr)}</p>
            <p className="text-[11px] text-slate-400">{selectedMonthLabel}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Type', 'Tokens', 'Rate', 'Cost'].map((h) => (
                    <th
                      key={h}
                      className="pb-2 pr-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-50">
                  <td className="py-2.5 pr-3 font-medium text-slate-900">Input Tokens</td>
                  <td className="py-2.5 pr-3 tabular-nums">{formatCount(ai.inputTokens)}</td>
                  <td className="py-2.5 pr-3 text-slate-600">
                    ₹{ai.inputRateInrPer1k.toFixed(4)}/1K
                  </td>
                  <td className="py-2.5 tabular-nums font-medium text-slate-900">
                    {formatInr((ai.inputTokens / 1000) * ai.inputRateInrPer1k)}
                  </td>
                </tr>
                <tr className="border-b border-slate-50">
                  <td className="py-2.5 pr-3 font-medium text-slate-900">Output Tokens</td>
                  <td className="py-2.5 pr-3 tabular-nums">{formatCount(ai.outputTokens)}</td>
                  <td className="py-2.5 pr-3 text-slate-600">
                    ₹{ai.outputRateInrPer1k.toFixed(4)}/1K
                  </td>
                  <td className="py-2.5 tabular-nums font-medium text-slate-900">
                    {formatInr((ai.outputTokens / 1000) * ai.outputRateInrPer1k)}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2.5 pr-3 font-bold text-slate-900">Total</td>
                  <td className="py-2.5 pr-3 font-bold tabular-nums text-slate-900">
                    {formatCount(ai.totalTokens)}
                  </td>
                  <td className="py-2.5 pr-3" />
                  <td className="py-2.5 font-bold tabular-nums text-slate-900">
                    {formatInr(ai.grossCostInr)}
                  </td>
                </tr>
                {ai.includedTokens > 0 ? (
                  <tr className="border-b border-slate-50 text-slate-500">
                    <td className="py-2 pr-3 pl-2">Plan included</td>
                    <td className="py-2 pr-3 tabular-nums">-{formatCount(ai.includedTokens)}</td>
                    <td className="py-2 pr-3" />
                    <td className="py-2 tabular-nums text-emerald-600">
                      -{formatInr(ai.includedCreditInr)}
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <td className="pt-2 pr-3 font-bold text-slate-900">Final</td>
                  <td className="pt-2 pr-3" />
                  <td className="pt-2 pr-3" />
                  <td className="pt-2 font-bold tabular-nums text-slate-900">
                    {formatInr(ai.billedCostInr)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-slate-500">Daily token usage</p>
              {ai.dailyTokens.some((d) => d.tokens > 0) ? (
                <>
                  <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ai.dailyTokens} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                        <Tooltip content={<DailyTokensTooltip />} cursor={{ fill: '#f1f5f9' }} />
                        <Bar dataKey="tokens" fill="#3B82F6" radius={[2, 2, 0, 0]} maxBarSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                    {[1, 5, 10, 15, 20, 25, 30].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-400">No AI token usage recorded this month</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-slate-900">Usage by Agent</h3>
            {ai.agents.length > 0 ? (
              <div className="mt-3 space-y-4">
                {ai.agents.map((agent, index) => (
                  <div key={agent.agentId}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate text-sm font-medium text-slate-800">
                          {agent.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-slate-600">
                        {formatCount(agent.tokens)} tokens ({agent.pct}%)
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${AGENT_BAR_COLORS[index % AGENT_BAR_COLORS.length]}`}
                        style={{ width: `${Math.max(agent.pct, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No AI agent usage this month</p>
            )}

            {ai.includedTokens > 0 ? (
              <div className="mt-6 rounded-lg border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">Monthly Quota</p>
                  <span
                    className={`text-xs font-bold ${
                      ai.quotaPct > 100 ? 'text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {ai.quotaPct}% used
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {formatCount(ai.totalTokens)} used / {formatCount(ai.includedTokens)} included
                </p>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${ai.quotaPct > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(ai.quotaPct, 100)}%` }}
                  />
                </div>
                {ai.quotaPct > 100 && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                    <ArrowUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      Over quota by {formatCount(ai.totalTokens - ai.includedTokens)} tokens —
                      overage billed at plan rates
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default UsageCost;
