/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CampaignAnalytics, CampaignChannel } from '../../types';

/** Stage accents — green only on delivered; others stay neutral/ink. */
const STAGE_ACCENT: Record<string, string> = {
  sent: '#64748b',
  delivered: 'var(--color-primary, #064e3b)',
  read: '#334155',
  opened: '#334155',
  failed: '#b91c1c',
};

function formatMedian(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 60 * 60_000) {
    const m = Math.floor(ms / 60_000);
    const s = Math.round((ms % 60_000) / 1000);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(ms / (60 * 60_000));
  const m = Math.round((ms % (60 * 60_000)) / 60_000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const QuietEmpty: React.FC<{ title: string; description: string; className?: string }> = ({
  title,
  description,
  className = '',
}) => (
  <div
    className={`flex h-full min-h-[140px] flex-col items-center justify-center px-4 py-8 text-center ${className}`}
    role="status"
  >
    <p className="text-sm font-semibold text-gray-600">{title}</p>
    <p className="mt-1 max-w-sm text-xs font-medium leading-relaxed text-gray-400">
      {description}
    </p>
  </div>
);

const KpiCell: React.FC<{
  label: string;
  value: string;
  hint?: string;
  accent?: 'primary' | 'danger' | 'none';
}> = ({ label, value, hint, accent = 'none' }) => {
  const valueTone =
    accent === 'primary'
      ? 'text-primary'
      : accent === 'danger'
        ? 'text-red-700'
        : 'text-gray-900';

  return (
    <div className="min-w-0 px-5 py-5 sm:px-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-400">
        {label}
      </p>
      <p className={`mt-1.5 text-[1.75rem] font-semibold tracking-tight tabular-nums leading-none ${valueTone}`}>
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 text-[11px] font-medium leading-snug text-gray-400">{hint}</p>
      )}
    </div>
  );
};

/** Left-aligned proportional bars — same track width, no centered “broken” steps. */
const StatusFunnel: React.FC<{
  steps: Array<CampaignAnalytics['funnel'][number]>;
  readLabel: string;
}> = ({ steps, readLabel }) => {
  const reduceMotion = useReducedMotion();
  const active = useMemo(() => steps.filter((s) => s.count > 0), [steps]);
  const maxCount = active.reduce((m, s) => Math.max(m, s.count), 0);

  if (active.length === 0) {
    return (
      <QuietEmpty
        title="No delivery data yet"
        description="Funnel stages appear once messages start sending and status updates arrive."
      />
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label={`Status funnel: Sent to ${readLabel}`}>
      {active.map((step, i) => {
        const widthPct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
        const accent = STAGE_ACCENT[step.key] ?? '#94a3b8';
        return (
          <div key={step.key} role="listitem" className="min-w-0">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-gray-800">{step.label}</span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">
                <span className="text-sm font-semibold text-gray-900">
                  {step.count.toLocaleString()}
                </span>
                <span className="ml-1.5 text-gray-400">{step.pct}%</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-sm bg-black/[0.04]">
              <motion.div
                className="h-full rounded-sm origin-left"
                // ponytail: scaleX grow; width via style keeps track layout stable
                style={{
                  backgroundColor: accent,
                  width: `${Math.max(widthPct, widthPct > 0 ? 2 : 0)}%`,
                }}
                initial={reduceMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.05 + i * 0.04,
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
                role="presentation"
              />
            </div>
          </div>
        );
      })}
      <p className="pt-0.5 text-[11px] font-medium text-gray-400">
        Empty stages hidden · bar length relative to largest stage
      </p>
    </div>
  );
};

const FailureReasons: React.FC<{
  rows: CampaignAnalytics['failureReasons'];
}> = ({ rows }) => {
  const reduceMotion = useReducedMotion();
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);

  if (rows.length === 0) {
    return (
      <QuietEmpty
        title="No failures logged"
        description="When sends fail, reasons and share of failures show up here."
      />
    );
  }

  return (
    <ul className="max-h-[240px] space-y-1.5 overflow-y-auto pr-0.5" aria-label="Failure reasons">
      {rows.map((row, i) => {
        const pctWidth = max > 0 ? (row.count / max) * 100 : 0;
        return (
          <li key={row.reason} className="relative min-w-0 overflow-hidden rounded-md">
            <motion.div
              className="absolute inset-y-0 left-0 bg-red-500/[0.07]"
              initial={reduceMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                delay: reduceMotion ? 0 : 0.06 + i * 0.03,
                duration: 0.4,
                ease: 'easeOut',
              }}
              style={{ width: `${pctWidth}%`, transformOrigin: 'left' }}
              aria-hidden
            />
            <div className="relative flex items-baseline justify-between gap-3 px-2.5 py-2">
              <span className="min-w-0 break-words text-sm font-medium text-gray-800">
                {row.reason}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-gray-500">
                {row.count}
                <span className="ml-1 text-gray-400">{row.pct}%</span>
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const LagHistogram: React.FC<{
  title: string;
  medianMs: number | null;
  samples: number;
  buckets: CampaignAnalytics['lag']['sendToDelivered']['buckets'];
  blocked?: boolean;
}> = ({ title, medianMs, samples, buckets, blocked }) => {
  const reduceMotion = useReducedMotion();
  const data = useMemo(
    () => buckets.map((b) => ({ label: b.label, count: b.count })),
    [buckets]
  );
  const hasData = samples > 0 && !blocked;

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-end justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">
            {hasData ? `${samples} sample${samples === 1 ? '' : 's'}` : 'Timeline pending'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
            Median
          </p>
          <p className="text-sm font-semibold tabular-nums text-gray-900">
            {formatMedian(medianMs)}
          </p>
        </div>
      </div>
      <div className="h-[160px] w-full">
        {!hasData ? (
          <QuietEmpty
            title={blocked ? 'Lag charts unavailable' : 'Waiting for timeline'}
            description={
              blocked
                ? 'Status timestamps are not ready for this campaign yet.'
                : 'Lag distributions fill in once send → delivered (and read) timestamps are backfilled.'
            }
            className="min-h-[160px] py-2"
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#e8e6e1" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.06)',
                  fontSize: 12,
                  background: '#fafaf8',
                  boxShadow: 'none',
                }}
              />
              <Bar
                dataKey="count"
                name="Recipients"
                fill="#94a3b8"
                radius={[2, 2, 0, 0]}
                isAnimationActive={!reduceMotion}
                animationDuration={reduceMotion ? 0 : 500}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

type Props = {
  channel: CampaignChannel;
  analytics: CampaignAnalytics;
};

export const CampaignDetailAnalytics: React.FC<Props> = ({ channel, analytics }) => {
  const reduceMotion = useReducedMotion();
  const readLabel = channel === 'email' ? 'Opened' : 'Read';
  const lagBlocked = !analytics.lag.available;

  return (
    <motion.section
      className="rounded-2xl bg-white ring-1 ring-slate-200/80"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
      aria-labelledby="campaign-analytics-heading"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/5 px-5 py-4 sm:px-6">
        <div>
          <h3
            id="campaign-analytics-heading"
            className="text-sm font-semibold tracking-tight text-gray-900"
          >
            Analytics
          </h3>
          <p className="mt-0.5 text-xs font-medium text-gray-400">
            Delivery funnel, rates, and timing
          </p>
        </div>
      </header>

      {/* KPI strip — typography grid, not gradient cards */}
      <div className="grid grid-cols-2 divide-y divide-black/5 border-b border-black/5 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <KpiCell
          label="Success rate"
          value={`${analytics.successRate}%`}
          accent="primary"
          hint="Delivered+ / total recipients"
        />
        <KpiCell
          label="Failure rate"
          value={`${analytics.failureRate}%`}
          accent={analytics.failureRate > 0 ? 'danger' : 'none'}
          hint="Failed / total recipients"
        />
        <KpiCell
          label="Completion time"
          value={analytics.completion.durationLabel ?? '—'}
          hint={
            analytics.completion.completedAt
              ? `Last dispatch ${formatDate(analytics.completion.completedAt)}`
              : 'Pending until all recipients are sent'
          }
        />
        <KpiCell
          label="Started"
          value={formatDate(analytics.completion.startedAt)}
          hint="Scheduled (fallback: sent / created)"
        />
      </div>

      <div className="grid grid-cols-1 gap-0 xl:grid-cols-2">
        <div className="min-w-0 border-b border-black/5 px-5 py-5 sm:px-6 xl:border-b-0 xl:border-r">
          <h4 className="text-sm font-semibold text-gray-900">Status funnel</h4>
          <p className="mb-4 text-[11px] font-medium text-gray-400">
            Sent → Delivered → {readLabel}
            {analytics.funnel.some((s) => s.key === 'failed' && s.count > 0) ? ' · Failed' : ''}
          </p>
          <StatusFunnel steps={analytics.funnel} readLabel={readLabel} />
        </div>

        <div className="min-w-0 border-b border-black/5 px-5 py-5 sm:px-6 xl:border-b-0">
          <h4 className="text-sm font-semibold text-gray-900">Failure reasons</h4>
          <p className="mb-4 text-[11px] font-medium text-gray-400">
            Per-recipient error breakdown
          </p>
          <FailureReasons rows={analytics.failureReasons} />
        </div>
      </div>

      {lagBlocked && analytics.lag.blockedReason && (
        <div
          className="flex items-start gap-3 border-b border-amber-100/80 bg-amber-50/50 px-5 py-3.5 sm:px-6"
          role="status"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-950">Timing charts on hold</p>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-amber-900/75">
              {analytics.lag.blockedReason} Lag histograms usually appear after status timeline
              backfill.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 divide-y divide-black/5 border-t border-black/5 xl:grid-cols-2 xl:divide-x xl:divide-y-0">
        <div className="px-5 py-5 sm:px-6">
          <LagHistogram
            title="Send → delivered lag"
            medianMs={analytics.lag.sendToDelivered.medianMs}
            samples={analytics.lag.sendToDelivered.samples}
            buckets={analytics.lag.sendToDelivered.buckets}
            blocked={lagBlocked}
          />
        </div>
        <div className="px-5 py-5 sm:px-6">
          <LagHistogram
            title={`Delivered → ${readLabel.toLowerCase()} lag`}
            medianMs={analytics.lag.deliveredToRead.medianMs}
            samples={analytics.lag.deliveredToRead.samples}
            buckets={analytics.lag.deliveredToRead.buckets}
            blocked={lagBlocked}
          />
        </div>
      </div>
    </motion.section>
  );
};
