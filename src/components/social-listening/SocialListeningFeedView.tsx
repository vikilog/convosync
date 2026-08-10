import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bot,
  Clapperboard,
  Heart,
  Image as ImageIcon,
  Instagram,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { pathForIntegrationsChannel } from '../../routes';
import { SocialListeningSubNav } from './SocialListeningSubNav';
import {
  useInstagramAccountsQuery,
  useListeningMedia,
  useListeningProfile,
  usePostAutomationMap,
} from './hooks/useSocialListeningQueries';
import { PostConfigSideSheet } from './post-config/PostConfigSideSheet';

type ListeningMediaItem = {
  id: string;
  caption: string | null;
  mediaType: string;
  mediaProductType: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  permalink: string | null;
  timestamp: string | null;
  likeCount: number | null;
  commentsCount: number | null;
  isReel: boolean;
};

type MediaFilter = 'all' | 'posts' | 'reels';

function formatCount(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function parseApiError(err: unknown): string {
  if (!(err instanceof Error)) return 'Something went wrong';
  try {
    const parsed = JSON.parse(err.message) as { error?: string; details?: string };
    return [parsed.error, parsed.details].filter(Boolean).join(' · ') || err.message;
  } catch {
    return err.message;
  }
}

export const SocialListeningFeedView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const igFromUrl = searchParams.get('ig');
  const [selectedIgId, setSelectedIgId] = useState<string | null>(igFromUrl);
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [extraItems, setExtraItems] = useState<ListeningMediaItem[]>([]);
  const [extraCursor, setExtraCursor] = useState<string | null>(null);
  const [insightPostId, setInsightPostId] = useState<string | null>(null);

  const accountsQ = useInstagramAccountsQuery();
  const accounts = accountsQ.data ?? [];

  useEffect(() => {
    if (!accounts.length) {
      setSelectedIgId(null);
      return;
    }
    if (selectedIgId && accounts.some((a) => a.instagramUserId === selectedIgId)) return;
    setSelectedIgId(accounts[0].instagramUserId);
  }, [accounts, selectedIgId]);

  const profileQ = useListeningProfile(selectedIgId);
  const mediaQ = useListeningMedia(selectedIgId);

  const pageItems = (mediaQ.data?.items ?? []) as ListeningMediaItem[];
  const items = useMemo(() => {
    const seen = new Set(pageItems.map((i) => i.id));
    const extras = extraItems.filter((i) => !seen.has(i.id));
    return [...pageItems, ...extras];
  }, [pageItems, extraItems]);

  const nextCursor = extraCursor !== null ? extraCursor : mediaQ.data?.nextCursor ?? null;

  const postIds = useMemo(() => items.map((i) => i.id), [items]);
  const automationQ = usePostAutomationMap(postIds);
  const automationByPost = automationQ.data ?? {};

  const profile = profileQ.data?.profile ?? null;
  const loadingAccounts = accountsQ.isLoading && !accountsQ.data;
  const loadingProfile = profileQ.isLoading && !profileQ.data;
  const loadingMedia = mediaQ.isLoading && !mediaQ.data;

  const insightPost = useMemo(
    () => items.find((i) => i.id === insightPostId) ?? null,
    [items, insightPostId]
  );

  useEffect(() => {
    const err = accountsQ.error || profileQ.error || mediaQ.error;
    if (err) setError(parseApiError(err));
    else setError('');
  }, [accountsQ.error, profileQ.error, mediaQ.error]);

  const filteredItems = useMemo(() => {
    if (filter === 'reels') return items.filter((i) => i.isReel);
    if (filter === 'posts') return items.filter((i) => !i.isReel);
    return items;
  }, [items, filter]);

  const loadFeed = () => {
    setExtraItems([]);
    setExtraCursor(null);
    void accountsQ.refetch();
    void profileQ.refetch();
    void mediaQ.refetch();
  };

  const loadMore = async () => {
    if (!selectedIgId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const mediaRes = await api.getInstagramListeningMedia({
        instagramUserId: selectedIgId,
        after: nextCursor,
        limit: 24,
      });
      setExtraItems((prev) => [...prev, ...mediaRes.items]);
      setExtraCursor(mediaRes.nextCursor);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const openPostComments = (postId: string) => {
    const path = selectedIgId
      ? `/social-listening/media/${encodeURIComponent(postId)}?ig=${encodeURIComponent(selectedIgId)}`
      : `/social-listening/media/${encodeURIComponent(postId)}`;
    navigate(path);
  };

  if (loadingAccounts) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-6">
        <div className="h-40 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/80" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-6">
        <SocialListeningSubNav />
        <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white px-6 py-16 text-center">
          <Instagram className="mb-3 h-10 w-10 text-[#C13584]" />
          <h2 className="text-lg font-black text-gray-950">Connect Instagram</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-500">
            Link an Instagram Business account to browse posts and configure the agent per post.
          </p>
          <button
            type="button"
            onClick={() => navigate(pathForIntegrationsChannel('instagram'))}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:bg-primary-hover"
          >
            Connect Instagram
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-6">
      <SocialListeningSubNav
        trailing={
          <button
            type="button"
            disabled={!selectedIgId || loadingProfile || loadingMedia}
            onClick={() => loadFeed()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white ring-1 ring-slate-200/80 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-surface-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingProfile || loadingMedia ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      {accounts.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {accounts.map((account) => {
            const active = account.instagramUserId === selectedIgId;
            const label = account.username
              ? `@${account.username}`
              : account.displayName || account.pageName || 'Instagram';
            return (
              <button
                key={account.instagramUserId}
                type="button"
                onClick={() => setSelectedIgId(account.instagramUserId)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                  active
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-white ring-1 ring-slate-200/80 text-gray-600 hover:bg-surface-muted'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600">
          {error}
        </p>
      )}

      <section className="rounded-2xl bg-white ring-1 ring-slate-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {loadingProfile && !profile ? (
          <div className="flex gap-4 animate-pulse">
            <div className="h-20 w-20 shrink-0 rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="h-3 w-full max-w-md rounded bg-slate-100" />
            </div>
          </div>
        ) : profile ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {profile.profilePictureUrl ? (
              <img
                src={profile.profilePictureUrl}
                alt=""
                className="h-20 w-20 shrink-0 rounded-2xl border border-black/5 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#fce8f0] text-[#C13584]">
                <Instagram className="h-8 w-8" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-black text-gray-950">
                {profile.name || profile.username || 'Instagram'}
              </h1>
              {profile.username && (
                <p className="text-sm font-bold text-gray-500">@{profile.username}</p>
              )}
              {profile.biography && (
                <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{profile.biography}</p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl bg-white p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          {(
            [
              { id: 'all' as const, label: 'All' },
              { id: 'posts' as const, label: 'Posts' },
              { id: 'reels' as const, label: 'Reels' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                filter === f.id
                  ? 'bg-[#0F172A] text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] font-bold text-gray-400">
          Hover a post → Insights · click post to open comments
        </p>
      </div>

      {loadingMedia && !items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => {
              const thumb = item.thumbnailUrl || item.mediaUrl;
              const autoInfo = automationByPost[item.id];
              const agentOn = autoInfo?.autoResponseEnabled ?? false;
              const journeyOn = Boolean(autoInfo?.commentAutomationJourneyId);
              const badgeLabel =
                agentOn && journeyOn
                  ? 'Both'
                  : agentOn
                    ? 'Agent'
                    : journeyOn
                      ? 'Auto'
                      : 'Off';
              const badgeOn = agentOn || journeyOn;
              return (
                <div
                  key={item.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => openPostComments(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openPostComments(item.id);
                    }
                  }}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-gray-300">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  {item.isReel && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      <Clapperboard className="h-3 w-3" />
                      Reel
                    </span>
                  )}
                  <span
                    className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold shadow-sm ${
                      badgeOn ? 'bg-emerald-600 text-white' : 'bg-black/65 text-white/90'
                    }`}
                    title={
                      journeyOn
                        ? autoInfo?.commentAutomationJourneyName || 'Instagram Automation'
                        : undefined
                    }
                  >
                    <Bot className="h-3 w-3" />
                    {badgeLabel}
                  </span>

                  {/* Insights — hover only */}
                  <button
                    type="button"
                    aria-label="AI insights"
                    title="AI insights"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setInsightPostId(item.id);
                    }}
                    className="absolute bottom-2 right-2 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-cyan-600 text-white opacity-0 shadow-lg transition-opacity hover:bg-cyan-700 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
                    {item.caption && (
                      <p className="mb-1 line-clamp-2 pr-10 text-[11px] font-medium text-white/90">
                        {item.caption}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] font-bold text-white">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatCount(item.likeCount)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {formatCount(item.commentsCount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {nextCursor && (
            <div className="flex justify-center pb-4">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => void loadMore()}
                className="rounded-xl bg-white ring-1 ring-slate-200/80 px-5 py-2 text-sm font-bold text-gray-700 hover:bg-surface-muted disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      <PostConfigSideSheet
        open={Boolean(insightPostId)}
        postId={insightPostId}
        postCaption={insightPost?.caption}
        onClose={() => setInsightPostId(null)}
        onOpenPost={
          insightPostId
            ? () => {
                const id = insightPostId;
                setInsightPostId(null);
                openPostComments(id);
              }
            : undefined
        }
      />
    </div>
  );
};
