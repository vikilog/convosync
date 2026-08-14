import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type DashboardStat = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
  /** Real per-day series backing this stat (e.g. last 7 days) — omit rather than fake one. */
  spark?: number[];
};

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 56;
  const h = 20;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const step = w / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = 2 + (h - 4) * (1 - (v - lo) / span);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [lastX, lastY] = points[points.length - 1].split(',');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0" aria-hidden>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary/70"
      />
      <circle cx={lastX} cy={lastY} r={1.8} className="fill-primary" />
    </svg>
  );
}

/**
 * A single hairline-divided stat table instead of N separate bordered cards —
 * six repeated card shells fighting for attention read as noisier than one
 * unified surface with quiet internal dividers (gap-px + shared bg trick,
 * robust across any column wrap unlike `divide-x` on a wrapping grid).
 */
export function DashboardStatRail({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80 shadow-sm sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.key} className="flex flex-col gap-2 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-400" aria-hidden />
                <span className="truncate">{stat.label}</span>
              </span>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums text-neutral-900">
              {stat.value}
            </p>
            {stat.spark || stat.meta ? (
              <div className="flex items-center justify-between gap-2">
                {stat.spark ? <Sparkline values={stat.spark} /> : <span />}
                {stat.meta}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
