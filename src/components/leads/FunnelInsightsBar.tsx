import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';

type Insights = {
  entered: number;
  converted: number;
  conversionRate: number;
  stageMoves: number;
  avgDaysToConvert: number | null;
  byStage: Array<{ stageId: string; name: string; isFinal: boolean; count: number }>;
};

export function FunnelInsightsBar({
  funnelId,
  refreshKey,
}: {
  funnelId: string;
  /** Bump after convert / drag to refetch. */
  refreshKey?: number | string;
}) {
  const [insights, setInsights] = useState<Insights | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api
      .getLeadFunnelInsights(funnelId)
      .then((res) => {
        if (!cancelled) setInsights(res.insights);
      })
      .catch(() => {
        if (!cancelled) setInsights(null);
      });
    return () => {
      cancelled = true;
    };
  }, [funnelId, refreshKey]);

  if (!insights) return null;

  const ratePct = Math.round(insights.conversionRate * 100);

  return (
    <div className="shrink-0 rounded-2xl bg-white ring-1 ring-slate-200/80 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-end gap-4">
        <Stat label="Entered funnel" value={String(insights.entered)} />
        <Stat label="Converted" value={String(insights.converted)} />
        <Stat label="Conversion" value={`${ratePct}%`} />
        <Stat label="Board moves" value={String(insights.stageMoves)} />
        <Stat
          label="Avg days to contact"
          value={
            insights.avgDaysToConvert != null ? String(insights.avgDaysToConvert) : '—'
          }
        />
      </div>
      {insights.byStage.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {insights.byStage.map((s) => (
            <span
              key={s.stageId}
              className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                s.isFinal
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {s.name}
              {s.isFinal ? ' · Final' : ''}: {s.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="text-lg font-black tabular-nums text-gray-900">{value}</p>
    </div>
  );
}
