import React, { useMemo, useState } from 'react';
import { BarChart2, TrendingUp, Eye, ThumbsUp, Users } from 'lucide-react';
import { FacebookPost, PageInsights, PageInsightsDailyPoint } from '../types';

type MetricKey = 'reach' | 'engagedUsers' | 'postEngagements' | 'pageViews' | 'newFollowers';

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; color: string; fill: string; icon: React.ReactNode }
> = {
  reach: {
    label: 'Reach',
    color: '#2563eb',
    fill: 'rgba(37, 99, 235, 0.12)',
    icon: <Eye className="w-3.5 h-3.5" />,
  },
  engagedUsers: {
    label: 'Engaged Users',
    color: '#16a34a',
    fill: 'rgba(22, 163, 74, 0.12)',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
  postEngagements: {
    label: 'Post Engagements',
    color: '#db2777',
    fill: 'rgba(219, 39, 119, 0.12)',
    icon: <ThumbsUp className="w-3.5 h-3.5" />,
  },
  pageViews: {
    label: 'Page Views',
    color: '#ea580c',
    fill: 'rgba(234, 88, 12, 0.12)',
    icon: <BarChart2 className="w-3.5 h-3.5" />,
  },
  newFollowers: {
    label: 'New Followers',
    color: '#0284c7',
    fill: 'rgba(91, 76, 245, 0.12)',
    icon: <Users className="w-3.5 h-3.5" />,
  },
};

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  max: number,
  padding: { top: number; bottom: number; left: number; right: number }
): string {
  if (values.length === 0) return '';
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const step = values.length <= 1 ? 0 : innerW / (values.length - 1);

  const points = values.map((v, i) => {
    const x = padding.left + i * step;
    const y = padding.top + innerH - (max > 0 ? (v / max) * innerH : 0);
    return { x, y };
  });

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const baseY = padding.top + innerH;
  const areaClose = ` L ${points[points.length - 1].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z`;
  return line + areaClose;
}

function buildLinePath(
  values: number[],
  width: number,
  height: number,
  max: number,
  padding: { top: number; bottom: number; left: number; right: number }
): string {
  if (values.length === 0) return '';
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const step = values.length <= 1 ? 0 : innerW / (values.length - 1);

  return values
    .map((v, i) => {
      const x = padding.left + i * step;
      const y = padding.top + innerH - (max > 0 ? (v / max) * innerH : 0);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

const DailyTrendChart: React.FC<{
  daily: PageInsightsDailyPoint[];
  activeMetric: MetricKey;
  onMetricChange: (key: MetricKey) => void;
}> = ({ daily, activeMetric, onMetricChange }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const padding = { top: 20, right: 12, bottom: 32, left: 44 };
  const width = 720;
  const height = 260;

  const values = useMemo(
    () => daily.map((d) => d[activeMetric]),
    [daily, activeMetric]
  );
  const max = Math.max(...values, 1);
  const cfg = METRIC_CONFIG[activeMetric];

  const yTicks = useMemo(() => {
    const steps = 4;
    return Array.from({ length: steps + 1 }, (_, i) => Math.round((max / steps) * (steps - i)));
  }, [max]);

  const xLabelIndices = useMemo(() => {
    if (daily.length <= 7) return daily.map((_, i) => i);
    const step = Math.ceil(daily.length / 7);
    return daily.map((_, i) => i).filter((i) => i % step === 0 || i === daily.length - 1);
  }, [daily]);

  const areaPath = buildAreaPath(values, width, height, max, padding);
  const linePath = buildLinePath(values, width, height, max, padding);

  const innerW = width - padding.left - padding.right;
  const step = values.length <= 1 ? 0 : innerW / (values.length - 1);
  const hoverX =
    hoverIndex != null ? padding.left + hoverIndex * step : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Page performance trend</h4>
          <p className="text-meta text-gray-400 font-medium mt-0.5">Daily metrics — last 28 days</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => {
            const m = METRIC_CONFIG[key];
            const active = key === activeMetric;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onMetricChange(key)}
                className={`px-2.5 py-1 rounded-lg text-sm font-bold flex items-center gap-1 transition-all ${
                  active
                    ? 'text-white shadow-sm'
                    : 'bg-[#fafaf9] text-gray-500 border border-slate-200 hover:border-channel-green/30'
                }`}
                style={active ? { backgroundColor: m.color } : undefined}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {daily.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-sm text-gray-400 font-medium">
          No daily data yet. Sync insights after granting read_insights permission.
        </div>
      ) : (
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full min-w-[320px] h-auto"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {yTicks.map((tick, i) => {
              const y =
                padding.top +
                (height - padding.top - padding.bottom) * (i / (yTicks.length - 1));
              return (
                <g key={tick}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-gray-400 text-meta font-bold"
                  >
                    {formatNum(tick)}
                  </text>
                </g>
              );
            })}

            <path d={areaPath} fill={cfg.fill} />
            <path d={linePath} fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {values.map((v, i) => {
              const x = padding.left + i * step;
              const y =
                padding.top +
                (height - padding.top - padding.bottom) -
                (max > 0 ? (v / max) * (height - padding.top - padding.bottom) : 0);
              return (
                <circle
                  key={daily[i].date}
                  cx={x}
                  cy={y}
                  r={hoverIndex === i ? 5 : 3}
                  fill={cfg.color}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              );
            })}

            {hoverX != null && hoverIndex != null && (
              <>
                <line
                  x1={hoverX}
                  y1={padding.top}
                  x2={hoverX}
                  y2={height - padding.bottom}
                  stroke={cfg.color}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
                <g transform={`translate(${Math.min(hoverX + 8, width - 120)}, ${padding.top + 8})`}>
                  <rect x="0" y="0" width="108" height="52" rx="8" fill="#111827" opacity="0.95" />
                  <text x="10" y="18" className="fill-white text-sm font-bold">
                    {daily[hoverIndex].label}
                  </text>
                  <text x="10" y="36" className="fill-white text-meta font-black">
                    {cfg.label}: {formatNum(values[hoverIndex])}
                  </text>
                </g>
              </>
            )}

            {xLabelIndices.map((i) => {
              const x = padding.left + i * step;
              return (
                <text
                  key={daily[i].date}
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-gray-400 text-meta font-bold"
                >
                  {daily[i].label}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

const MultiMetricOverview: React.FC<{ daily: PageInsightsDailyPoint[] }> = ({ daily }) => {
  const keys: MetricKey[] = ['reach', 'postEngagements', 'pageViews'];

  const normalized = useMemo(() => {
    return keys.map((key) => {
      const vals = daily.map((d) => d[key]);
      const max = Math.max(...vals, 1);
      return { key, vals, max, total: vals.reduce((a, b) => a + b, 0) };
    });
  }, [daily]);

  if (daily.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
      <h4 className="font-bold text-gray-900 text-sm mb-1">Combined overview</h4>
      <p className="text-meta text-gray-400 font-medium mb-5">Normalized daily comparison</p>
      <div className="h-56 flex items-end justify-between gap-1 sm:gap-2 px-1 border-b border-slate-200 pb-2">
        {daily.map((day, idx) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
            <div className="w-full h-44 flex gap-0.5 items-end justify-center">
              {normalized.map(({ key, max }) => {
                const val = day[key];
                const pct = max > 0 ? (val / max) * 100 : 0;
                const cfg = METRIC_CONFIG[key];
                return (
                  <div
                    key={key}
                    title={`${cfg.label}: ${formatNum(val)}`}
                    className="flex-1 max-w-[6px] rounded-t-sm transition-all group-hover:opacity-80"
                    style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%`, backgroundColor: cfg.color }}
                  />
                );
              })}
            </div>
            {idx % Math.ceil(daily.length / 8) === 0 && (
              <span className="text-badge font-bold text-gray-400 truncate w-full text-center">
                {day.label}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-sm font-bold">
        {keys.map((key) => (
          <div key={key} className="flex items-center gap-1.5 text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: METRIC_CONFIG[key].color }} />
            {METRIC_CONFIG[key].label}
          </div>
        ))}
      </div>
    </div>
  );
};

const PostEngagementChart: React.FC<{ posts: FacebookPost[] }> = ({ posts }) => {
  const ranked = useMemo(() => {
    return [...posts]
      .map((p) => ({
        id: p.id,
        label: p.message.slice(0, 42) + (p.message.length > 42 ? '…' : '') || 'Post',
        likes: p.likesCount,
        comments: p.commentsCount,
        shares: p.sharesCount,
        total: p.likesCount + p.commentsCount + p.sharesCount,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [posts]);

  const maxTotal = Math.max(...ranked.map((p) => p.total), 1);

  if (ranked.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm text-gray-400 font-medium">
        No posts to compare engagement yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6">
      <h4 className="font-bold text-gray-900 text-sm mb-1">Post engagement breakdown</h4>
      <p className="text-meta text-gray-400 font-medium mb-5">Likes, comments & shares per post</p>
      <div className="space-y-4">
        {ranked.map((post) => (
          <div key={post.id}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-meta font-bold text-gray-700 truncate flex-1">{post.label}</p>
              <span className="text-sm font-black text-sky-600 font-mono shrink-0">
                {formatNum(post.total)}
              </span>
            </div>
            <div className="h-3 bg-[#f0f9ff] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-pink-500"
                style={{ width: `${(post.likes / maxTotal) * 100}%` }}
                title={`Likes: ${post.likes}`}
              />
              <div
                className="h-full bg-blue-500"
                style={{ width: `${(post.comments / maxTotal) * 100}%` }}
                title={`Comments: ${post.comments}`}
              />
              <div
                className="h-full bg-channel-green"
                style={{ width: `${(post.shares / maxTotal) * 100}%` }}
                title={`Shares: ${post.shares}`}
              />
            </div>
            <div className="flex gap-3 mt-1 text-meta font-bold text-gray-400">
              <span>♥ {post.likes}</span>
              <span>💬 {post.comments}</span>
              <span>↗ {post.shares}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-5 pt-4 border-t border-slate-200 text-sm font-bold text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-500" /> Likes</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Comments</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-channel-green" /> Shares</span>
      </div>
    </div>
  );
};

const EngagementRateCard: React.FC<{ insights: PageInsights; daily: PageInsightsDailyPoint[] }> = ({
  insights,
  daily,
}) => {
  const rate =
    insights.pageImpressions > 0
      ? ((insights.pageEngagedUsers / insights.pageImpressions) * 100).toFixed(1)
      : '0.0';

  const dailyRates = daily
    .filter((d) => d.reach > 0)
    .map((d) => ({
      label: d.label,
      rate: (d.engagedUsers / d.reach) * 100,
    }));

  const avgDaily =
    dailyRates.length > 0
      ? (dailyRates.reduce((s, d) => s + d.rate, 0) / dailyRates.length).toFixed(1)
      : '—';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-sky-50 to-white border border-slate-200 rounded-2xl p-5">
        <p className="text-sm font-extrabold text-gray-400 uppercase tracking-widest">Engagement rate</p>
        <p className="text-3xl font-black text-sky-600 font-mono mt-2">{rate}%</p>
        <p className="text-meta text-gray-500 font-medium mt-1">Engaged users ÷ reach (28 days)</p>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-white border border-slate-200 rounded-2xl p-5">
        <p className="text-sm font-extrabold text-gray-400 uppercase tracking-widest">Avg daily rate</p>
        <p className="text-3xl font-black text-green-600 font-mono mt-2">{avgDaily}{avgDaily !== '—' ? '%' : ''}</p>
        <p className="text-meta text-gray-500 font-medium mt-1">Based on {dailyRates.length} days with reach data</p>
      </div>
    </div>
  );
};

export const FacebookInsightsCharts: React.FC<{
  insights: PageInsights;
  daily: PageInsightsDailyPoint[];
  posts: FacebookPost[];
}> = ({ insights, daily, posts }) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('reach');

  return (
    <div className="space-y-6">
      <EngagementRateCard insights={insights} daily={daily} />
      <DailyTrendChart
        daily={daily}
        activeMetric={activeMetric}
        onMetricChange={setActiveMetric}
      />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MultiMetricOverview daily={daily} />
        <PostEngagementChart posts={posts} />
      </div>
    </div>
  );
};
