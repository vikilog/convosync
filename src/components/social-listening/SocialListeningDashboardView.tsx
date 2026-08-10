import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { pathForIntegrationsChannel } from '../../routes';
import { SocialListeningSubNav } from './SocialListeningSubNav';
import { StatCardRow, type DashboardRange } from './dashboard/StatCardRow';
import { IntentBreakdownChart } from './dashboard/IntentBreakdownChart';
import { NeedsAttentionList } from './dashboard/NeedsAttentionList';
import { ActivityFeed } from './dashboard/ActivityFeed';
import { TopPostsTable } from './dashboard/TopPostsTable';
import {
  useDashboardStats,
  useInstagramAccountsQuery,
  useIntentBreakdown,
  useInvalidateSocialListening,
  useNeedsAttention,
  useSocialActivity,
  useTopPosts,
} from './hooks/useSocialListeningQueries';

const RANGES: { id: DashboardRange; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'all', label: 'All' },
];

export const SocialListeningDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState<DashboardRange>('7d');
  const invalidate = useInvalidateSocialListening();

  const accountsQ = useInstagramAccountsQuery();
  const statsQ = useDashboardStats(range);
  const intentsQ = useIntentBreakdown(range);
  const attentionQ = useNeedsAttention();
  const activityQ = useSocialActivity();
  const topPostsQ = useTopPosts(range);

  const hasAccounts =
    accountsQ.data == null ? null : accountsQ.data.length > 0;

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
        trailing={
          <div className="inline-flex rounded-xl bg-surface-muted p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                  range === r.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {hasAccounts === false && (
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

      {hasAccounts !== false && (
        <>
          {emptyWorkspace && (
            <div className="rounded-xl border border-dashed border-black/10 bg-white px-4 py-3 text-sm text-gray-600">
              No comment data yet — open{' '}
              <Link to="/social-listening/content" className="font-bold text-primary hover:underline">
                Content
              </Link>{' '}
              to sync posts and pull comments.
            </div>
          )}

          <StatCardRow
            stats={statsQ.data ?? null}
            loading={statsQ.isLoading && !statsQ.data}
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
