import React, { useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Plus } from 'lucide-react';
import type { ChartPoint } from '../../lib/chartUtils';
import { isChartEmpty } from '../../lib/chartUtils';

interface MessagePerformanceChartProps {
  data: ChartPoint[];
  onNewCampaign: () => void;
  onRangeChange: (days: 7 | 14 | 30) => void;
  activeRange: 7 | 14 | 30;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const labels: Record<string, string> = {
    sent: 'Sent',
    delivered: 'Delivered',
    read: 'Read',
  };

  const colors: Record<string, string> = {
    sent: 'bg-swiss-ink',
    delivered: 'bg-swiss-accent',
    read: 'bg-swiss-faint',
  };

  return (
    <div className="border border-swiss-line bg-white px-3 py-2 font-swiss">
      <p className="mb-2 text-xs font-semibold text-swiss-ink">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-8 text-xs">
            <span className="flex items-center gap-1.5 text-swiss-muted">
              <span className={`h-2 w-2 rounded-full ${colors[entry.dataKey] ?? 'bg-swiss-faint'}`} />
              {labels[entry.dataKey] ?? entry.dataKey}
            </span>
            <span className="font-semibold tabular-nums text-swiss-ink">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const MessagePerformanceChart: React.FC<MessagePerformanceChartProps> = ({
  data,
  onNewCampaign,
  onRangeChange,
  activeRange,
}) => {
  const empty = useMemo(() => isChartEmpty(data), [data]);
  const ranges: Array<7 | 14 | 30> = [7, 14, 30];

  return (
    <div className="flex h-full flex-col font-swiss">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13.5px] font-bold text-swiss-ink">Message performance</p>
        <div className="inline-flex items-center gap-0.5 rounded-lg bg-swiss-line/40 p-0.5">
          {ranges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => onRangeChange(range)}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                activeRange === range
                  ? 'bg-swiss-accent text-white'
                  : 'text-swiss-muted hover:text-swiss-ink'
              }`}
            >
              {range}D
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-5 text-[11px] text-swiss-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-swiss-ink" />
          Sent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-swiss-accent" />
          Delivered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-swiss-faint" />
          Read
        </span>
      </div>

      <div className="min-h-[240px] flex-1">
        {empty ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center border border-dashed border-swiss-line text-center">
            <p className="text-sm font-medium text-swiss-ink">No message data yet</p>
            <p className="mt-1 max-w-xs text-sm text-swiss-muted">
              Run a campaign to populate this chart.
            </p>
            <button
              type="button"
              onClick={onNewCampaign}
              className="mt-4 inline-flex cursor-pointer items-center gap-1.5 border border-swiss-ink px-4 py-2 text-sm font-medium text-swiss-ink hover:bg-swiss-ink hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Create campaign
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="sentFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111111" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#111111" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e4e4e4" strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8a8a8a', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#c4c4c4', fontSize: 11 }}
                width={36}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="linear"
                dataKey="sent"
                stroke="#111111"
                strokeWidth={1.5}
                fill="url(#sentFill)"
                dot={false}
                activeDot={{ r: 3 }}
              />
              <Line
                type="linear"
                dataKey="delivered"
                stroke="#0033ff"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="linear"
                dataKey="read"
                stroke="#c4c4c4"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                dot={false}
                activeDot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
