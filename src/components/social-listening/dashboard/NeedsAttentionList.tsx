import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ExternalLink, RefreshCw, Siren } from 'lucide-react';
import { api } from '../../../lib/api';
import { IntentBadge } from '../IntentBadge';
import type { IntentLabel } from '../types';

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s waiting`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m waiting`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h waiting`;
  return `${Math.floor(diff / 86400)}d waiting`;
}

export type NeedsAttentionItem = {
  id: string;
  kind: 'complaint' | 'interested' | 'question' | 'pending' | 'failed_dm';
  postId: string;
  username: string;
  commentText: string;
  postThumbnailUrl: string;
  intent: IntentLabel;
  confidence: number;
  waitingSince: string;
  dmError: string | null;
  suggestedAction: 'approve_dm' | 'escalate' | 'retry_dm' | 'open_review';
};

export function NeedsAttentionList({
  items,
  loading,
  onChanged,
}: {
  items: NeedsAttentionItem[] | null;
  loading: boolean;
  onChanged: () => void;
}) {
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const busyRef = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const runAction = async (item: NeedsAttentionItem) => {
    if (item.suggestedAction === 'open_review') return;
    // Synchronous re-entrancy guard — a second click on the same item before
    // React re-renders the disabled button must not fire a second request.
    if (busyRef.current.has(item.id)) return;
    busyRef.current.add(item.id);
    setBusyIds(new Set(busyRef.current));
    setError(null);
    try {
      if (item.suggestedAction === 'retry_dm') {
        await api.retrySocialListeningDm(item.id);
      } else {
        await api.socialListeningCommentAction(item.id, {
          action: item.suggestedAction === 'escalate' ? 'escalate' : 'approve_dm',
        });
      }
      onChanged();
    } catch (err) {
      let message = err instanceof Error ? err.message : 'Action failed';
      try {
        const parsed = JSON.parse(message) as { error?: string; details?: string };
        message = [parsed.error, parsed.details].filter(Boolean).join(' · ') || message;
      } catch {
        /* keep */
      }
      setError(message);
    } finally {
      busyRef.current.delete(item.id);
      setBusyIds(new Set(busyRef.current));
    }
  };

  return (
    <div className="flex min-h-[280px] flex-col rounded-xl bg-white ring-1 ring-slate-200/80 p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-neutral-900">Needs attention</h2>
          <p className="text-xs text-neutral-500">
            Pending review, complaints, leads, and failed DMs
          </p>
        </div>
        <Link
          to="/social-listening/review"
          className="text-[11px] font-bold text-primary hover:underline"
        >
          Full queue →
        </Link>
      </div>

      {error && (
        <p className="mb-2 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : !items?.length ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
          <p className="text-sm font-bold text-gray-800">All clear</p>
          <p className="mt-1 max-w-xs text-xs text-gray-400">
            Nothing urgent right now. New comments will show up here when they need a human.
          </p>
        </div>
      ) : (
        <ul className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
          {items.map((item) => {
            const accent =
              item.kind === 'complaint'
                ? 'border-red-200 bg-red-50/40'
                : item.kind === 'failed_dm'
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-black/5 bg-white';
            const ActionIcon =
              item.suggestedAction === 'retry_dm'
                ? RefreshCw
                : item.suggestedAction === 'escalate'
                  ? Siren
                  : item.suggestedAction === 'open_review'
                    ? ExternalLink
                    : AlertTriangle;
            const actionLabel =
              item.suggestedAction === 'retry_dm'
                ? 'Retry DM'
                : item.suggestedAction === 'escalate'
                  ? 'Escalate'
                  : item.suggestedAction === 'open_review'
                    ? 'Review'
                    : 'Approve & DM';

            return (
              <li
                key={item.id}
                className={`flex gap-3 rounded-xl border p-2.5 ${accent}`}
              >
                <Link
                  to={`/social-listening/media/${encodeURIComponent(item.postId)}`}
                  className="shrink-0"
                >
                  {item.postThumbnailUrl ? (
                    <img
                      src={item.postThumbnailUrl}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover border border-black/5"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-slate-100" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">@{item.username}</span>
                    <IntentBadge
                      intentLabel={item.intent}
                      confidence={item.confidence}
                      classificationStatus="classified"
                    />
                    <span className="text-[10px] font-medium text-gray-400">
                      {timeAgo(item.waitingSince)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                    {item.commentText}
                  </p>
                  {item.dmError && (
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-amber-700">
                      {item.dmError}
                    </p>
                  )}
                </div>
                {item.suggestedAction === 'open_review' ? (
                  <Link
                    to="/social-listening/review"
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 self-center rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-primary-hover"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Review
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={busyIds.has(item.id)}
                    onClick={() => void runAction(item)}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 self-center rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-primary-hover disabled:opacity-60"
                  >
                    <ActionIcon className={`h-3 w-3 ${busyIds.has(item.id) ? 'animate-spin' : ''}`} />
                    {busyIds.has(item.id) ? '…' : actionLabel}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
