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
  const h = 18;
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
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-swiss-faint"
      />
      <circle cx={lastX} cy={lastY} r={1.6} className="fill-swiss-accent" />
    </svg>
  );
}

/**
 * Swiss minimal: no cards, no icons — a hairline-divided grid. The gap-px +
 * shared-line-color-bg trick renders perfect dividers regardless of how the
 * grid wraps across breakpoints (unlike divide-x, which only separates DOM
 * siblings, not visual rows).
 */
export function DashboardStatRail({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden border-y border-swiss-line bg-swiss-line sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.key} className="bg-white px-5 py-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-swiss-muted">
            {stat.label}
          </p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-[30px] font-light leading-none tracking-tight tabular-nums text-swiss-ink">
              {stat.value}
            </p>
            {stat.spark ? <Sparkline values={stat.spark} /> : null}
          </div>
          {stat.meta ? <div className="mt-1.5">{stat.meta}</div> : null}
        </div>
      ))}
    </div>
  );
}
