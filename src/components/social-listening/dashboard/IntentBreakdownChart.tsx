import React, { useMemo } from 'react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const COLORS: Record<string, string> = {
  interested: '#0d9488',
  question: '#0284c7',
  complaint: '#dc2626',
  spam: '#64748b',
  unclear: '#a8a29e',
};

export function IntentBreakdownChart({
  items,
  loading,
}: {
  items: Array<{ intent: string; label: string; count: number }> | null;
  loading: boolean;
}) {
  const data = useMemo(
    () => (items || []).filter((i) => i.count > 0).map((i) => ({
      name: i.label,
      intent: i.intent,
      value: i.count,
    })),
    [items]
  );
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex h-full min-h-[260px] flex-col bg-white border border-swiss-line p-5">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-swiss-ink">Intent breakdown</h2>
        <p className="text-xs text-swiss-muted">Comment distribution by AI intent</p>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-36 w-36 animate-pulse rounded-full bg-slate-100" />
        </div>
      ) : total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-swiss-muted">No comments in this range</p>
          <p className="mt-1 text-xs text-swiss-faint">Sync posts from Content to start classifying.</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-[180px] w-full sm:w-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.intent}
                      fill={COLORS[entry.intent] || '#94a3b8'}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [String(value ?? 0), 'Comments']}
                  contentStyle={{
                    borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.06)',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex flex-1 flex-col gap-1.5">
            {(items || []).map((row) => (
              <li
                key={row.intent}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <span className="inline-flex items-center gap-2 font-semibold text-swiss-ink">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: COLORS[row.intent] || '#94a3b8' }}
                  />
                  {row.label}
                </span>
                <span className="tabular-nums font-bold text-swiss-ink">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
