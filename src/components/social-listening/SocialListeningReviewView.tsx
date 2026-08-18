import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  LayoutGrid,
  LayoutList,
  Rows3,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { BulkActionBar } from './BulkActionBar';
import { IntentSection } from './IntentSection';
import { ReviewCard } from './ReviewCard';
import { ReviewCardTile } from './ReviewCardTile';
import { ReviewRow } from './ReviewRow';
import { SocialListeningSubNav } from './SocialListeningSubNav';
import { SECTION_ORDER, SECTION_THEMES, primaryActionFor } from './intentConfig';
import {
  sortByNewest,
  triageSectionFor,
  type IntentFilter,
  type ReviewComment,
  type ReviewStatus,
  type SortMode,
  type TriageSectionId,
  type ViewMode,
} from './types';
import {
  slKeys,
  useInvalidateSocialListening,
  useSocialListeningComments,
} from './hooks/useSocialListeningQueries';

function emptyCounts(): Record<TriageSectionId, number> {
  return { complaints: 0, sales: 0, questions: 0, low_confidence: 0 };
}

function priorityRank(id: TriageSectionId): number {
  return SECTION_ORDER.indexOf(id);
}

function ReviewSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl bg-white ring-1 ring-slate-200/80 p-4"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-40 rounded bg-slate-100" />
              <div className="h-4 w-full max-w-md rounded bg-slate-100" />
              <div className="h-3 w-2/3 rounded bg-slate-50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const SocialListeningReviewView: React.FC = () => {
  const qc = useQueryClient();
  const invalidate = useInvalidateSocialListening();
  const pendingQ = useSocialListeningComments('new');
  const allQ = useSocialListeningComments('all');

  const items = pendingQ.data ?? [];
  const recentHandled = useMemo(
    () =>
      (allQ.data ?? [])
        .filter((c) => c.status !== 'pending')
        .sort(sortByNewest)
        .slice(0, 12),
    [allQ.data]
  );

  const loading = pendingQ.isLoading && !pendingQ.data;
  const loadError =
    pendingQ.error instanceof Error
      ? pendingQ.error.message
      : pendingQ.error
        ? 'Failed to load review queue'
        : '';

  const [intentFilter, setIntentFilter] = useState<IntentFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [viewMode, setViewMode] = useState<ViewMode>('detailed');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addLeadBusyId, setAddLeadBusyId] = useState<string | null>(null);
  const [addLeadError, setAddLeadError] = useState('');
  const [addLeadCommentId, setAddLeadCommentId] = useState<string | null>(null);
  const [funnels, setFunnels] = useState<Array<{ id: string; name: string }>>([]);
  const [pickFunnelId, setPickFunnelId] = useState('');
  const [funnelsLoading, setFunnelsLoading] = useState(false);

  const patchPendingCache = useCallback(
    (ids: string[], status: ReviewStatus) => {
      const idSet = new Set(ids);
      qc.setQueryData<ReviewComment[]>(slKeys.comments('new'), (prev) =>
        (prev ?? []).map((i) => (idSet.has(i.id) ? { ...i, status } : i))
      );
    },
    [qc]
  );

  const statusScoped = useMemo(
    () => items.filter((i) => i.status === 'pending'),
    [items]
  );

  const intentCounts = useMemo(() => {
    const counts = emptyCounts();
    for (const item of statusScoped) {
      counts[triageSectionFor(item)] += 1;
    }
    return counts;
  }, [statusScoped]);

  const filtered = useMemo(() => {
    let list =
      intentFilter === 'all'
        ? statusScoped
        : statusScoped.filter((i) => triageSectionFor(i) === intentFilter);

    list = [...list];
    if (sortMode === 'newest') {
      list.sort(sortByNewest);
    } else {
      list.sort((a, b) => {
        const pr = priorityRank(triageSectionFor(a)) - priorityRank(triageSectionFor(b));
        if (pr !== 0) return pr;
        return sortByNewest(a, b);
      });
    }
    return list;
  }, [statusScoped, intentFilter, sortMode]);

  const grouped = useMemo(() => {
    const map: Record<TriageSectionId, ReviewComment[]> = {
      complaints: [],
      sales: [],
      questions: [],
      low_confidence: [],
    };
    for (const item of filtered) {
      map[triageSectionFor(item)].push(item);
    }
    return map;
  }, [filtered]);

  const selectedItems = useMemo(
    () => filtered.filter((i) => selected.has(i.id)),
    [filtered, selected]
  );

  const unifiedSection = useMemo((): TriageSectionId | null => {
    if (selectedItems.length === 0) return null;
    const first = triageSectionFor(selectedItems[0]);
    return selectedItems.every((i) => triageSectionFor(i) === first) ? first : null;
  }, [selectedItems]);

  const [queueError, setQueueError] = useState('');
  // Synchronous mirror of in-flight ids — the optimistic status flip in
  // markStatus already disables most buttons on the next render, but a
  // ref-based guard also rejects a same-tick double-fire (e.g. a fast
  // double-click) that lands before React has re-rendered. runningIds is
  // the state-backed twin used purely to drive the BulkActionBar busy UI.
  const runningRef = useRef<Set<string>>(new Set());
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());

  const markStatus = (ids: string[], status: ReviewStatus) => {
    patchPendingCache(ids, status);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  };

  const runQueueAction = async (
    ids: string[],
    action: 'approve_dm' | 'approve_reply' | 'escalate' | 'ignore'
  ) => {
    const targetIds = ids.filter((id) => !runningRef.current.has(id));
    if (targetIds.length === 0) return;
    for (const id of targetIds) runningRef.current.add(id);
    setRunningIds(new Set(runningRef.current));
    setQueueError('');

    const reviewStatus: ReviewStatus = action === 'ignore' ? 'ignored' : 'approved';
    markStatus(targetIds, reviewStatus);
    const results = await Promise.allSettled(
      targetIds.map((id) => api.socialListeningCommentAction(id, { action }))
    );

    const failedIds = targetIds.filter((_, i) => results[i].status === 'rejected');
    if (failedIds.length > 0) {
      // Roll back the optimistic status so failed items reappear in the
      // queue instead of silently vanishing as if they'd been handled.
      patchPendingCache(failedIds, 'pending');
      setSelected((prev) => {
        const next = new Set(prev);
        for (const id of failedIds) next.add(id);
        return next;
      });
      setQueueError(
        failedIds.length === targetIds.length
          ? 'Action failed — the item was put back in the queue. Please try again.'
          : `${failedIds.length} of ${targetIds.length} failed and were put back in the queue.`
      );
    }

    for (const id of targetIds) runningRef.current.delete(id);
    setRunningIds(new Set(runningRef.current));
    invalidate();
  };

  const onPrimary = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const section = triageSectionFor(item);
    if (section === 'low_confidence') {
      setDetailId(id);
      return;
    }
    const kind = primaryActionFor(section).kind;
    if (
      kind === 'approve_dm' &&
      !window.confirm('Send this DM to the customer now? This cannot be undone.')
    ) {
      return;
    }
    void runQueueAction(
      [id],
      kind === 'approve_dm'
        ? 'approve_dm'
        : kind === 'escalate'
          ? 'escalate'
          : 'approve_reply'
    );
  };

  const onIgnore = (id: string) => {
    void runQueueAction([id], 'ignore');
  };

  const openAddLead = async (commentId: string) => {
    setAddLeadCommentId(commentId);
    setAddLeadError('');
    setPickFunnelId('');
    setFunnelsLoading(true);
    try {
      const res = await api.getLeadFunnels();
      setFunnels(res.funnels.map((f) => ({ id: f.id, name: f.name })));
      if (res.funnels.length === 1) setPickFunnelId(res.funnels[0].id);
    } catch (err) {
      setAddLeadError(err instanceof Error ? err.message : 'Failed to load funnels');
      setAddLeadCommentId(null);
    } finally {
      setFunnelsLoading(false);
    }
  };

  const confirmAddLeadRef = useRef(false);
  const confirmAddLead = async () => {
    if (!addLeadCommentId || !pickFunnelId) return;
    if (confirmAddLeadRef.current) return;
    confirmAddLeadRef.current = true;
    const id = addLeadCommentId;
    setAddLeadBusyId(id);
    setAddLeadError('');
    try {
      const res = await api.createLead({ socialCommentId: id, funnelId: pickFunnelId });
      const leadId = res.lead?.id;
      if (leadId) {
        qc.setQueryData<ReviewComment[]>(slKeys.comments('all'), (prev) =>
          (prev ?? []).map((c) => (c.id === id ? { ...c, leadId } : c))
        );
      }
      setAddLeadCommentId(null);
      invalidate();
    } catch (err) {
      setAddLeadError(err instanceof Error ? err.message : 'Failed to add lead');
    } finally {
      confirmAddLeadRef.current = false;
      setAddLeadBusyId(null);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const detailItem = detailId ? items.find((i) => i.id === detailId) ?? null : null;

  const intentTabs: { id: IntentFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: statusScoped.length },
    ...SECTION_ORDER.map((id) => ({
      id,
      label:
        id === 'low_confidence'
          ? 'Unclear'
          : id === 'sales'
            ? 'Sales'
            : SECTION_THEMES[id].label,
      count: intentCounts[id],
    })),
  ];

  const renderList = () => {
    if (viewMode === 'cards') {
      return (
        <div className="grid grid-cols-1 gap-2.5 pb-24 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <ReviewCardTile
              key={item.id}
              item={item}
              sectionId={triageSectionFor(item)}
              onPrimary={onPrimary}
              onIgnore={onIgnore}
              onOpen={(id) => setDetailId(id)}
            />
          ))}
        </div>
      );
    }

    if (viewMode === 'compact') {
      return (
        <div className="space-y-1.5 pb-24">
          {filtered.map((item) => (
            <ReviewRow
              key={item.id}
              item={item}
              sectionId={triageSectionFor(item)}
              selected={selected.has(item.id)}
              onToggleSelect={toggleSelect}
              onOpen={(id) => setDetailId(id)}
            />
          ))}
        </div>
      );
    }

    // List: group by intent when showing all
    if (intentFilter === 'all') {
      return (
        <div className="space-y-3 pb-24">
          {SECTION_ORDER.map((sectionId) => (
            <IntentSection
              key={sectionId}
              sectionId={sectionId}
              count={grouped[sectionId].length}
            >
              {grouped[sectionId].map((item) => (
                <ReviewCard
                  key={item.id}
                  item={item}
                  sectionId={sectionId}
                  onPrimary={onPrimary}
                  onIgnore={onIgnore}
                />
              ))}
            </IntentSection>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-3 pb-24">
        {filtered.map((item) => (
          <ReviewCard
            key={item.id}
            item={item}
            sectionId={triageSectionFor(item)}
            onPrimary={onPrimary}
            onIgnore={onIgnore}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white p-4 md:p-6 selection:bg-sky-500/15">
      <SocialListeningSubNav />

      {loadError && (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600"
        >
          {loadError}
        </p>
      )}

      {queueError && (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600"
        >
          {queueError}
        </p>
      )}

      <div className="sticky top-0 z-10 -mx-1 flex shrink-0 flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-sm sm:flex-row sm:items-center">
        <div
          role="tablist"
          aria-label="Intent filters"
          className="flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-x-auto"
        >
          {intentTabs.map((tab) => {
            const active = intentFilter === tab.id;
            const theme = tab.id === 'all' ? null : SECTION_THEMES[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setIntentFilter(tab.id)}
                className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${
                  active
                    ? theme
                      ? `${theme.accentBg} ${theme.accentText}`
                      : 'bg-[#0F172A] text-white'
                    : 'text-slate-600 hover:bg-surface-muted'
                }`}
              >
                {theme ? (
                  <span className={`h-1.5 w-1.5 rounded-full ${theme.accentDot}`} />
                ) : null}
                {tab.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                    active
                      ? theme
                        ? 'bg-white/70'
                        : 'bg-white/15 text-white/80'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
          <div
            role="group"
            aria-label="View mode"
            className="flex rounded-lg border border-black/10 bg-white p-0.5"
          >
            {(
              [
                { id: 'detailed' as const, label: 'List', icon: LayoutList },
                { id: 'cards' as const, label: 'Cards', icon: LayoutGrid },
                { id: 'compact' as const, label: 'Compact', icon: Rows3 },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={viewMode === id}
                onClick={() => {
                  setViewMode(id);
                  if (id !== 'compact') setSelected(new Set());
                }}
                className={`inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-md px-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 ${
                  viewMode === id
                    ? 'bg-[#0F172A] text-white'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </button>
            ))}
          </div>

          <label className="flex min-h-9 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-2.5 text-xs font-bold text-slate-600">
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="cursor-pointer bg-transparent text-xs font-bold text-[#0F172A] outline-none focus-visible:ring-0"
            >
              <option value="priority">Priority</option>
              <option value="newest">Newest</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <ReviewSkeleton />
      ) : filtered.length === 0 ? (
        <div className="space-y-4">
          {statusScoped.length > 0 && (
            <p className="px-1 text-sm text-slate-500">
              No comments match this filter. Try All.
            </p>
          )}

          {statusScoped.length === 0 && recentHandled.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                Recently handled
              </h3>
              {addLeadError && (
                <p
                  role="alert"
                  className="mb-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                >
                  {addLeadError}
                </p>
              )}
              <div className="space-y-2">
                {recentHandled.map((item) => (
                  <ReviewCard
                    key={item.id}
                    item={item}
                    sectionId={triageSectionFor(item)}
                    hideQueueActions
                    onPrimary={() => undefined}
                    onIgnore={() => undefined}
                    onAddLead={(id) => void openAddLead(id)}
                    addLeadBusy={addLeadBusyId === item.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        renderList()
      )}

      {addLeadCommentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Add to lead</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Choose which funnel receives this lead.
            </p>
            {funnelsLoading ? (
              <p className="mt-4 text-sm text-gray-400">Loading funnels…</p>
            ) : funnels.length === 0 ? (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                No funnels yet. Create one under Leads first.
              </p>
            ) : (
              <select
                value={pickFunnelId}
                onChange={(e) => setPickFunnelId(e.target.value)}
                className="mt-4 w-full cursor-pointer rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Select funnel…</option>
                {funnels.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
            {addLeadError && (
              <p className="mt-2 text-xs font-bold text-red-600">{addLeadError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddLeadCommentId(null);
                  setAddLeadError('');
                }}
                className="cursor-pointer rounded-xl border border-black/10 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!pickFunnelId || Boolean(addLeadBusyId)}
                onClick={() => void confirmAddLead()}
                className="cursor-pointer rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {addLeadBusyId ? 'Adding…' : 'Add to lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'compact' && (
        <BulkActionBar
          selectedCount={selected.size}
          unifiedSection={unifiedSection}
          busy={[...selected].some((id) => runningIds.has(id))}
          onClear={() => setSelected(new Set())}
          onIgnore={() => void runQueueAction([...selected], 'ignore')}
          onApprove={() => {
            if (!unifiedSection) return;
            const kind = primaryActionFor(unifiedSection).kind;
            if (
              kind === 'approve_dm' &&
              !window.confirm(
                `Send a DM to all ${selected.size} selected customers now? This cannot be undone.`
              )
            ) {
              return;
            }
            void runQueueAction(
              [...selected],
              kind === 'approve_dm'
                ? 'approve_dm'
                : kind === 'escalate'
                  ? 'escalate'
                  : 'approve_reply'
            );
          }}
        />
      )}

      <AnimatePresence>
        {detailItem && (
          <>
            <motion.button
              type="button"
              aria-label="Close detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 cursor-pointer bg-gray-900/40"
              onClick={() => setDetailId(null)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed top-0 right-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h3 className="text-base font-bold text-[#0F172A]">Comment detail</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setDetailId(null)}
                  className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors duration-200 hover:bg-gray-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ReviewCard
                  item={detailItem}
                  sectionId={triageSectionFor(detailItem)}
                  detailMode
                  onPrimary={(id) => {
                    void runQueueAction([id], 'approve_reply');
                    setDetailId(null);
                  }}
                  onIgnore={(id) => {
                    onIgnore(id);
                    setDetailId(null);
                  }}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
