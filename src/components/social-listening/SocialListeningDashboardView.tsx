import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Eye, Facebook, Instagram, ThumbsUp, TrendingUp, Users } from 'lucide-react';
import { pathForIntegrationsChannel } from '../../routes';
import { startFacebookPageConnect } from '../../lib/metaOAuth';
import { useFacebookPageConnection } from '../../hooks/inbox/useInboxMeta';
import { SocialListeningSubNav } from './SocialListeningSubNav';
import {
  SocialListeningPlatformSwitcher,
  useSocialListeningPlatform,
} from './SocialListeningPlatformSwitcher';
import { StatCardRow, type DashboardRange } from './dashboard/StatCardRow';
import { IntentBreakdownChart } from './dashboard/IntentBreakdownChart';
import { NeedsAttentionList } from './dashboard/NeedsAttentionList';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { TopPostsTable } from './dashboard/TopPostsTable';
import {
  useDashboardStats,
  useFacebookPageInsights,
  useInstagramAccountsQuery,
  useIntentBreakdown,
  useInvalidateSocialListening,
  useNeedsAttention,
  useSocialActivity,
  useTopPosts,
} from './hooks/useSocialListeningQueries';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const FacebookInsightsStrip: React.FC<{
  data: ReturnType<typeof useFacebookPageInsights>['data'];
  loading: boolean;
}> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[88px] animate-pulse rounded-xl bg-white ring-1 ring-slate-200/80" />
        ))}
      </div>
    );
  }

  if (!data.insights) {
    return (
      <div className="rounded-xl border border-dashed border-black/10 bg-white px-4 py-3 text-sm text-gray-600">
        {data.error === 'Missing read_insights permission'
          ? 'Grant read_insights permission on the connected Page to see reach and engagement here.'
          : data.error || 'Page insights unavailable.'}
      </div>
    );
  }

  const stats = [
    { label: 'Followers', value: formatCount(data.insights.pageFans), icon: Users },
    { label: 'Total Reach', value: formatCount(data.insights.pageImpressions), icon: Eye },
    { label: 'Engaged Users', value: formatCount(data.insights.pageEngagedUsers), icon: TrendingUp },
    { label: 'Engagements', value: formatCount(data.insights.pagePostEngagements), icon: ThumbsUp },
    { label: 'Page Views', value: formatCount(data.insights.pageViews), icon: Eye },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl bg-white p-3.5 ring-1 ring-slate-200/80">
          <div className="flex items-center gap-1.5 text-[#1877F2]">
            <s.icon className="h-3.5 w-3.5" />
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">{s.label}</p>
          </div>
          <p className="mt-1.5 text-xl font-black text-gray-900 font-mono leading-none">{s.value}</p>
        </div>
      ))}
    </div>
  );
};

const RANGES: { id: DashboardRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
];

const RangeDropdown: React.FC<{ range: DashboardRange; onChange: (r: DashboardRange) => void }> = ({
  range,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = RANGES.find((r) => r.id === range) ?? RANGES[1];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/80 hover:bg-slate-50"
      >
        {current.label}
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-40 overflow-hidden rounded-xl border border-black/5 bg-white shadow-xl">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onChange(r.id);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer items-center px-3 py-2.5 text-left text-xs font-bold transition-colors hover:bg-slate-50 ${
                range === r.id ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const SocialListeningDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<DashboardRange>('7d');
  const [connectingFacebook, setConnectingFacebook] = useState(false);
  const [facebookConnectError, setFacebookConnectError] = useState('');
  const invalidate = useInvalidateSocialListening();
  const platform = useSocialListeningPlatform();

  const handleConnectFacebook = async () => {
    setConnectingFacebook(true);
    setFacebookConnectError('');
    try {
      await startFacebookPageConnect();
    } catch (err) {
      setConnectingFacebook(false);
      setFacebookConnectError(err instanceof Error ? err.message : 'Failed to start Facebook login');
    }
  };
  const contentHref =
    platform === 'facebook' ? '/social-listening/content?platform=facebook' : '/social-listening/content';
  const reviewHref =
    platform === 'facebook' ? '/social-listening/review?platform=facebook' : '/social-listening/review';

  const accountsQ = useInstagramAccountsQuery();
  const facebookConnectionQ = useFacebookPageConnection();
  const facebookInsightsQ = useFacebookPageInsights(platform);
  const statsQ = useDashboardStats(range, platform);
  const intentsQ = useIntentBreakdown(range, platform);
  const attentionQ = useNeedsAttention(platform);
  const activityQ = useSocialActivity(platform);
  const topPostsQ = useTopPosts(range, platform);

  const hasAccounts =
    platform === 'facebook'
      ? facebookConnectionQ.data == null
        ? null
        : facebookConnectionQ.data.connected
      : accountsQ.data == null
        ? null
        : accountsQ.data.length > 0;

  const emptyWorkspace =
    hasAccounts &&
    !statsQ.isLoading &&
    statsQ.data &&
    statsQ.data.totalComments === 0 &&
    range === 'all';

  const refreshLocal = () => {
    invalidate();
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-6">
      <SocialListeningSubNav
        navExtra={<RangeDropdown range={range} onChange={setRange} />}
        trailing={<SocialListeningPlatformSwitcher />}
      />

      {hasAccounts === false && platform === 'instagram' && (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200/80 p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fce8f0] text-[#C13584]">
            <Instagram className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-black text-gray-950">Connect Instagram to start</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-600">
            The dashboard summarizes comments, automation, and leads once a Business account is
            connected.
          </p>
          <button
            type="button"
            onClick={() => navigate(pathForIntegrationsChannel('instagram'))}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:bg-primary-hover"
          >
            Connect Instagram
          </button>
        </div>
      )}

      {hasAccounts === false && platform === 'facebook' && (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200/80 p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f4ff] text-[#1877F2]">
            <Facebook className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-black text-gray-950">Connect a Facebook Page to start</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-600">
            The dashboard summarizes comments, automation, leads, and Page reach once a Facebook
            Page is connected.
          </p>
          {facebookConnectError && (
            <p className="mx-auto mt-3 max-w-md text-sm font-bold text-red-600">
              {facebookConnectError}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleConnectFacebook()}
            disabled={connectingFacebook}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {connectingFacebook ? 'Redirecting…' : 'Connect Facebook Page'}
          </button>
        </div>
      )}

      {hasAccounts !== false && (
        <>
          {emptyWorkspace && (
            <div className="rounded-xl border border-dashed border-black/10 bg-white px-4 py-3 text-sm text-gray-600">
              No comment data yet — open{' '}
              <Link to={contentHref} className="font-bold text-primary hover:underline">
                Content
              </Link>{' '}
              to sync posts and pull comments.
            </div>
          )}

          {platform === 'facebook' && (
            <FacebookInsightsStrip
              data={facebookInsightsQ.data}
              loading={facebookInsightsQ.isLoading && !facebookInsightsQ.data}
            />
          )}

          <StatCardRow
            stats={statsQ.data ?? null}
            loading={statsQ.isLoading && !statsQ.data}
            reviewHref={reviewHref}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <IntentBreakdownChart
              items={intentsQ.data ?? null}
              loading={intentsQ.isLoading && !intentsQ.data}
            />
            <ActivityFeed
              events={activityQ.data ?? null}
              loading={activityQ.isLoading && !activityQ.data}
            />
          </div>

          <NeedsAttentionList
            items={attentionQ.data ?? null}
            loading={attentionQ.isLoading && !attentionQ.data}
            onChanged={refreshLocal}
          />

          <TopPostsTable
            posts={topPostsQ.data ?? null}
            loading={topPostsQ.isLoading && !topPostsQ.data}
          />
        </>
      )}
    </div>
  );
};
