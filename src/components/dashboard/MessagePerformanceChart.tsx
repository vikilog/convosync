import React, { useMemo } from 'react';
import {
  LineChart,
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
    sent: 'bg-sky-500',
    delivered: 'bg-emerald-500',
    read: 'bg-slate-300',
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-2 text-xs font-semibold text-slate-900">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-8 text-xs">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className={`h-2 w-2 rounded-full ${colors[entry.dataKey] ?? 'bg-slate-400'}`} />
              {labels[entry.dataKey] ?? entry.dataKey}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">{entry.value}</span>
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
    <div className="flex h-full flex-col rounded-xl bg-white p-5 ring-1 ring-slate-200/80">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Message performance</h2>
          <p className="text-sm text-slate-500">Sent, delivered, and read over time</p>
        </div>
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
          {ranges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => onRangeChange(range)}
              className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeRange === range
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          Sent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Delivered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          Read
        </span>
      </div>

      <div className="min-h-[240px] flex-1">
        {empty ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center">
            <p className="text-sm font-medium text-slate-800">No message data yet</p>
            <p className="mt-1 max-w-xs text-sm text-slate-500">
              Run a campaign to populate this chart.
            </p>
            <button
              type="button"
              onClick={onNewCampaign}
              className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-channel-green px-4 py-2 text-sm font-medium text-white hover:bg-[#20bd5a]"
            >
              <Plus className="h-4 w-4" />
              Create campaign
            </button>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={36}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="sent"
                stroke="#0284c7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="read"
                stroke="#cbd5e1"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
