import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clapperboard,
  ExternalLink,
  Heart,
  Instagram,
  MessageCircle,
  RefreshCw,
  Reply,
  Send,
  UserPlus,
} from 'lucide-react';
import { api } from '../../lib/api';
import { pathForTab } from '../../routes';
import { IGNORE_BTN_CLASS } from './intentConfig';
import { IntentBadge, primaryActionForComment } from './IntentBadge';
import type { IntentLabel } from './types';
import {
  slKeys,
  useInvalidateSocialListening,
  useMediaComments,
  useMediaDetail,
} from './hooks/useSocialListeningQueries';
import { useQueryClient } from '@tanstack/react-query';
import { SocialListeningPostAgentPanel } from './SocialListeningPostAgentPanel';
import { clubCommentsByUser, commenterKey } from './commentClub';

function mediaIdFromPath(pathname: string): string | null {
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  // /social-listening/media/:mediaId
  if (parts[0] === 'social-listening' && parts[1] === 'media' && parts[2]) {
    try {
      return decodeURIComponent(parts[2]);
    } catch {
      return parts[2];
    }
  }
  return null;
}

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

type ListeningComment = {
  id: string;
  text: string;
  username: string | null;
  timestamp: string | null;
  likeCount: number | null;
  fromId: string | null;
  socialCommentId?: string | null;
  intent?: string | null;
  intentLabel?: IntentLabel | null;
  confidence?: number | null;
  classificationStatus?: 'pending' | 'classified' | 'failed' | null;
  classificationError?: string | null;
  reviewStatus?: 'pending' | 'approved' | 'ignored' | null;
  suggestedReply?: string | null;
  status?: string | null;
  publicReplyText?: string | null;
  dmReplyText?: string | null;
  dmSentAt?: string | null;
  dmStatus?: string | null;
  dmError?: string | null;
  leadId?: string | null;
  replies: ListeningComment[];
};

function formatCount(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(diff) || diff < 0) return '';
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
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

function findComment(list: ListeningComment[], id: string): ListeningComment | null {
  for (const c of list) {
    if (c.id === id) return c;
    const nested = findComment(c.replies || [], id);
    if (nested) return nested;
  }
  return null;
}

function findCommentBySocialId(
  list: ListeningComment[],
  socialCommentId: string
): ListeningComment | null {
  for (const c of list) {
    if (c.socialCommentId === socialCommentId) return c;
    const nested = findCommentBySocialId(c.replies || [], socialCommentId);
    if (nested) return nested;
  }
  return null;
}

function CommentsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-black/5 bg-surface p-3"
        >
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="h-3 w-24 rounded bg-slate-100" />
                <div className="h-6 w-20 rounded-lg bg-slate-50" />
              </div>
              <div className="space-y-1.5 rounded-lg border border-slate-50 bg-slate-50/80 px-2.5 py-2">
                <div className="h-2 w-16 rounded bg-slate-100" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-4/5 max-w-[85%] rounded bg-slate-100" />
              </div>
              <div className="flex gap-2">
                <div className="h-5 w-10 rounded bg-slate-50" />
                <div className="h-5 w-14 rounded-lg bg-slate-50" />
                <div className="h-5 w-12 rounded bg-slate-50" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentRow({
  comment,
  depth,
  replyToId,
  replyText,
  replySending,
  actionBusyId,
  addLeadBusyId,
  resolvedLeadId,
  hideIdentity,
  showLeadChrome,
  onStartReply,
  onChangeReply,
  onCancelReply,
  onSendReply,
  onPrimaryAction,
  onIgnore,
  onRetryClassify,
  onRetryDm,
  onAddLead,
}: {
  comment: ListeningComment;
  depth: number;
  replyToId: string | null;
  replyText: string;
  replySending: boolean;
  actionBusyId: string | null;
  addLeadBusyId: string | null;
  /** Lead for this commenter (any of their comments / workspace lead). */
  resolvedLeadId?: string | null;
  /** Inside a user club — slightly tighter chrome; username still shown in the meta row. */
  hideIdentity?: boolean;
  /** Show View lead / Add to lead on this row (first comment in a club). */
  showLeadChrome?: boolean;
  onStartReply: (id: string, suggested?: string | null) => void;
  onChangeReply: (text: string) => void;
  onCancelReply: () => void;
  onSendReply: () => void;
  onPrimaryAction: (comment: ListeningComment) => void;
  onIgnore: (comment: ListeningComment) => void;
  onRetryClassify: (comment: ListeningComment) => void;
  onRetryDm: (comment: ListeningComment) => void;
  onAddLead: (comment: ListeningComment) => void;
}) {
  const isReplying = replyToId === comment.id;
  const busy = actionBusyId === (comment.socialCommentId || comment.id);
  const addLeadBusy = addLeadBusyId === comment.socialCommentId;
  const primary = primaryActionForComment({
    intentLabel: comment.intentLabel ?? null,
    confidence: comment.confidence ?? null,
    classificationStatus: comment.classificationStatus ?? null,
    status: comment.status ?? null,
  });
  const handled = comment.status && comment.status !== 'new';
  const hasLead = Boolean(resolvedLeadId ?? comment.leadId);
  const showLeadAction = !hideIdentity || showLeadChrome;

  return (
    <div className={depth > 0 ? 'ml-6 border-l border-slate-100 pl-3' : ''}>
      <div
        className={
          hideIdentity
            ? 'border-t border-black/5 pt-3 first:border-t-0 first:pt-0'
            : 'rounded-xl border border-black/5 bg-surface p-3'
        }
      >
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fce8f0] text-[10px] font-black text-[#C13584]">
            {(comment.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            {/* Username · time · intent · status · lead — one row */}
            <div className="flex items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto whitespace-nowrap">
                <p className="shrink-0 text-sm font-bold text-gray-950">
                  {comment.username ? `@${comment.username}` : 'Instagram user'}
                </p>
                {comment.timestamp && (
                  <span className="shrink-0 text-[11px] font-medium text-gray-400">
                    {timeAgo(comment.timestamp)}
                  </span>
                )}
                <IntentBadge
                  intentLabel={comment.intentLabel ?? null}
                  confidence={comment.confidence ?? null}
                  classificationStatus={comment.classificationStatus ?? null}
                  classificationError={comment.classificationError}
                  retrying={busy}
                  onRetry={
                    comment.socialCommentId
                      ? () => onRetryClassify(comment)
                      : undefined
                  }
                />
                {handled && (
                  <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    {comment.status}
                  </span>
                )}
                {hasLead && (
                  <span className="shrink-0 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                    Lead
                  </span>
                )}
              </div>
              {showLeadAction &&
                comment.socialCommentId &&
                (hasLead ? (
                  <Link
                    to={pathForTab('leads')}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[11px] font-bold text-sky-700 hover:bg-sky-500/15"
                  >
                    View lead
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={addLeadBusy || busy}
                    onClick={() => onAddLead(comment)}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-500/15 disabled:opacity-50"
                  >
                    <UserPlus className="h-3 w-3" />
                    {addLeadBusy ? '…' : 'Add to lead'}
                  </button>
                ))}
            </div>
            <div className="mt-1.5 rounded-lg border border-[#E1306C]/15 bg-[#fce8f0]/30 px-2.5 py-2">
              <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap">
                {comment.text || '—'}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400">
                <Heart className="h-3 w-3" />
                {formatCount(comment.likeCount)}
              </span>

              {primary && !handled && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (primary.kind === 'ignore_only') {
                      onIgnore(comment);
                      return;
                    }
                    if (primary.kind === 'approve_reply' || primary.kind === 'review') {
                      onStartReply(comment.id, comment.suggestedReply);
                      return;
                    }
                    onPrimaryAction(comment);
                  }}
                  className={`inline-flex cursor-pointer items-center rounded-lg px-2.5 py-1 text-[11px] font-bold disabled:opacity-50 ${primary.className}`}
                >
                  {busy ? '…' : primary.label}
                </button>
              )}

              {!handled && primary?.kind !== 'ignore_only' && (
                <button
                  type="button"
                  disabled={busy || !comment.socialCommentId}
                  onClick={() => onIgnore(comment)}
                  className={`inline-flex cursor-pointer items-center rounded-lg px-2.5 py-1 text-[11px] font-bold disabled:opacity-50 ${IGNORE_BTN_CLASS}`}
                >
                  Ignore
                </button>
              )}

              <button
                type="button"
                onClick={() => onStartReply(comment.id, comment.suggestedReply)}
                className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-[#C13584]"
              >
                <Reply className="h-3 w-3" />
                Reply
              </button>
            </div>

            {isReplying && (
              <div className="mt-3 flex gap-2">
                <input
                  value={replyText}
                  onChange={(e) => onChangeReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onSendReply();
                    }
                  }}
                  placeholder="Write a reply…"
                  className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none focus:border-[#C13584]/40"
                  autoFocus
                />
                <button
                  type="button"
                  disabled={replySending || !replyText.trim()}
                  onClick={onSendReply}
                  className="inline-flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-black text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {replySending ? '…' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={onCancelReply}
                  className="rounded-xl px-2 text-xs font-bold text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            )}

            {(comment.publicReplyText || comment.dmReplyText || comment.dmStatus === 'failed') && (
              <div className="mt-3 space-y-2 rounded-lg border border-black/5 bg-surface-muted/80 p-2.5">
                {comment.publicReplyText && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Public reply sent
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-gray-700 whitespace-pre-wrap">
                      {comment.publicReplyText}
                    </p>
                  </div>
                )}
                {comment.dmReplyText && comment.dmStatus !== 'failed' && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      DM sent
                      {comment.dmSentAt ? ` · ${timeAgo(comment.dmSentAt)} ago` : ''}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-gray-700 whitespace-pre-wrap">
                      {comment.dmReplyText}
                    </p>
                  </div>
                )}
                {comment.dmStatus === 'failed' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      DM failed — comment may be too old (~7 day window)
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onRetryDm(comment)}
                      className="cursor-pointer text-[10px] font-bold text-sky-600 hover:underline disabled:opacity-50"
                    >
                      {busy ? 'Retrying…' : 'Retry DM'}
                    </button>
                    {comment.dmError && (
                      <span className="text-[10px] font-medium text-slate-400 line-clamp-1">
                        {comment.dmError}
                      </span>
                    )}
                    {comment.dmReplyText && (
                      <p className="w-full text-xs font-medium text-gray-500 whitespace-pre-wrap">
                        Draft DM: {comment.dmReplyText}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              replyToId={replyToId}
              replyText={replyText}
              replySending={replySending}
              actionBusyId={actionBusyId}
              addLeadBusyId={addLeadBusyId}
              resolvedLeadId={resolvedLeadId ?? comment.leadId}
              onStartReply={onStartReply}
              onChangeReply={onChangeReply}
              onCancelReply={onCancelReply}
              onSendReply={onSendReply}
              onPrimaryAction={onPrimaryAction}
              onIgnore={onIgnore}
              onRetryClassify={onRetryClassify}
              onRetryDm={onRetryDm}
              onAddLead={onAddLead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentClub({
  club,
  replyToId,
  replyText,
  replySending,
  actionBusyId,
  addLeadBusyId,
  onStartReply,
  onChangeReply,
  onCancelReply,
  onSendReply,
  onPrimaryAction,
  onIgnore,
  onRetryClassify,
  onRetryDm,
  onAddLead,
}: {
  club: {
    key: string;
    username: string | null;
    leadId: string | null;
    comments: ListeningComment[];
  };
  replyToId: string | null;
  replyText: string;
  replySending: boolean;
  actionBusyId: string | null;
  addLeadBusyId: string | null;
  onStartReply: (id: string, suggested?: string | null) => void;
  onChangeReply: (text: string) => void;
  onCancelReply: () => void;
  onSendReply: () => void;
  onPrimaryAction: (comment: ListeningComment) => void;
  onIgnore: (comment: ListeningComment) => void;
  onRetryClassify: (comment: ListeningComment) => void;
  onRetryDm: (comment: ListeningComment) => void;
  onAddLead: (comment: ListeningComment) => void;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-surface p-3">
      <div className="space-y-3">
        {club.comments.map((comment, index) => (
          <CommentRow
            key={comment.id}
            comment={comment}
            depth={0}
            replyToId={replyToId}
            replyText={replyText}
            replySending={replySending}
            actionBusyId={actionBusyId}
            addLeadBusyId={addLeadBusyId}
            resolvedLeadId={club.leadId}
            hideIdentity
            showLeadChrome={index === 0}
            onStartReply={onStartReply}
            onChangeReply={onChangeReply}
            onCancelReply={onCancelReply}
            onSendReply={onSendReply}
            onPrimaryAction={onPrimaryAction}
            onIgnore={onIgnore}
            onRetryClassify={onRetryClassify}
            onRetryDm={onRetryDm}
            onAddLead={onAddLead}
          />
        ))}
      </div>
    </div>
  );
}

export const SocialListeningMediaDetailView: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const invalidate = useInvalidateSocialListening();
  const mediaId = useMemo(() => mediaIdFromPath(location.pathname), [location.pathname]);
  const instagramUserId = searchParams.get('ig') || undefined;

  const mediaQ = useMediaDetail(mediaId, instagramUserId);
  const commentsQ = useMediaComments(mediaId, instagramUserId);

  const media = mediaQ.data?.media ?? null;
  const comments = (commentsQ.data?.comments ?? []) as ListeningComment[];
  const nextCursor = commentsQ.data?.nextCursor ?? null;
  const loading = (mediaQ.isLoading || commentsQ.isLoading) && !mediaQ.data && !commentsQ.data;
  const commentsLoading = commentsQ.isPending || (commentsQ.isFetching && !commentsQ.data);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    'approve_dm' | 'approve_reply' | 'escalate' | 'ignore' | 'review' | null
  >(null);
  const [addLeadCommentId, setAddLeadCommentId] = useState<string | null>(null);
  const [funnels, setFunnels] = useState<Array<{ id: string; name: string }>>([]);
  const [pickFunnelId, setPickFunnelId] = useState('');
  const [funnelsLoading, setFunnelsLoading] = useState(false);
  const [addLeadBusy, setAddLeadBusy] = useState(false);
  const [addLeadError, setAddLeadError] = useState('');
  const [postLeadFunnelId, setPostLeadFunnelId] = useState<string | null>(null);

  useEffect(() => {
    const err = mediaQ.error || commentsQ.error;
    if (err) setError(parseApiError(err));
    else setError('');
  }, [mediaQ.error, commentsQ.error]);

  useEffect(() => {
    if (!mediaId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.getSocialListeningPostSettings(mediaId);
        if (!cancelled) setPostLeadFunnelId(res.settings.leadFunnelId ?? null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  const load = useCallback(async (_opts?: { quiet?: boolean }) => {
    await Promise.all([mediaQ.refetch(), commentsQ.refetch()]);
  }, [mediaQ, commentsQ]);

  const loadMoreComments = async () => {
    if (!mediaId || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.getInstagramListeningComments(mediaId, {
        instagramUserId,
        after: nextCursor,
        limit: 50,
      });
      qc.setQueryData(
        slKeys.mediaComments(mediaId, instagramUserId),
        (prev: { comments: ListeningComment[]; nextCursor: string | null } | undefined) => ({
          comments: [...(prev?.comments ?? []), ...(page.comments as ListeningComment[])],
          nextCursor: page.nextCursor,
        })
      );
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const patchCommentStatus = (socialCommentId: string, status: string, extra?: Partial<ListeningComment>) => {
    if (!mediaId) return;
    const walk = (list: ListeningComment[]): ListeningComment[] =>
      list.map((c) => ({
        ...(c.socialCommentId === socialCommentId ? { ...c, status, ...extra } : c),
        replies: walk(c.replies || []),
      }));
    qc.setQueryData(
      slKeys.mediaComments(mediaId, instagramUserId),
      (prev: { comments: ListeningComment[]; nextCursor: string | null } | undefined) => {
        if (!prev) return prev;
        return { ...prev, comments: walk(prev.comments) };
      }
    );
  };

  const runAction = async (
    comment: ListeningComment,
    action: 'approve_dm' | 'approve_reply' | 'escalate' | 'ignore' | 'review',
    message?: string
  ) => {
    if (!comment.socialCommentId) return;
    setActionBusyId(comment.socialCommentId);
    setReplyError('');
    const optimistic =
      action === 'ignore'
        ? 'ignored'
        : action === 'escalate'
          ? 'escalated'
          : message || action === 'approve_dm'
            ? 'replied'
            : 'approved';
    patchCommentStatus(comment.socialCommentId, optimistic);
    try {
      const res = await api.socialListeningCommentAction(comment.socialCommentId, {
        action,
        message,
        instagramUserId,
      });
      patchCommentStatus(comment.socialCommentId, res.status, {
        publicReplyText: res.publicReplyText ?? comment.publicReplyText,
        dmReplyText: res.dmReplyText ?? comment.dmReplyText,
        dmStatus: res.dmStatus ?? comment.dmStatus,
        dmError: res.dmError ?? null,
        dmSentAt: res.dmStatus === 'sent' ? new Date().toISOString() : comment.dmSentAt,
        ...(res.leadId ? { leadId: res.leadId } : {}),
      });
      if (res.leadId) patchLeadIdForCommenter(comment, res.leadId);
      setReplyToId(null);
      setReplyText('');
      setPendingAction(null);
      if (res.dmStatus === 'failed') {
        setReplyError(
          res.dmError ||
            'Public reply sent, but DM failed — comment may be outside Meta’s ~7 day private-reply window.'
        );
      }
    } catch (err) {
      setReplyError(parseApiError(err));
      await load({ quiet: true });
    } finally {
      setActionBusyId(null);
      invalidate();
    }
  };

  const sendReply = async () => {
    if (!replyToId || !replyText.trim()) return;
    setReplySending(true);
    setReplyError('');
    try {
      const target = findComment(comments, replyToId);
      if (target?.socialCommentId && pendingAction) {
        await runAction(target, pendingAction, replyText.trim());
      } else if (target?.socialCommentId) {
        await runAction(target, 'approve_reply', replyText.trim());
      } else {
        await api.replyInstagramListeningComment(replyToId, replyText.trim(), instagramUserId);
        setReplyToId(null);
        setReplyText('');
        await load({ quiet: true });
      }
    } catch (err) {
      setReplyError(parseApiError(err));
    } finally {
      setReplySending(false);
    }
  };

  const onPrimaryAction = (comment: ListeningComment) => {
    const primary = primaryActionForComment({
      intentLabel: comment.intentLabel ?? null,
      confidence: comment.confidence ?? null,
      classificationStatus: comment.classificationStatus ?? null,
      status: comment.status ?? null,
    });
    if (!primary || primary.kind === 'ignore_only') return;
    if (primary.kind === 'approve_dm') {
      // Let backend AI generate public + DM pair (don't force suggestedReply as override)
      void runAction(comment, 'approve_dm');
      return;
    }
    if (primary.kind === 'escalate') {
      void runAction(comment, 'escalate');
      return;
    }
    setPendingAction(primary.kind === 'review' ? 'review' : 'approve_reply');
    setReplyToId(comment.id);
    setReplyText(comment.suggestedReply || '');
  };

  const patchLeadIdForCommenter = (from: ListeningComment, leadId: string) => {
    if (!mediaId) return;
    const key = commenterKey(from);
    const walk = (list: ListeningComment[]): ListeningComment[] =>
      list.map((c) => ({
        ...c,
        leadId: commenterKey(c) === key ? leadId : c.leadId,
        replies: walk(c.replies || []),
      }));
    qc.setQueryData(
      slKeys.mediaComments(mediaId, instagramUserId),
      (prev: { comments: ListeningComment[]; nextCursor: string | null } | undefined) => {
        if (!prev) return prev;
        return { ...prev, comments: walk(prev.comments) };
      }
    );
  };

  const openAddLead = async (comment: ListeningComment) => {
    if (!comment.socialCommentId) return;
    setAddLeadCommentId(comment.socialCommentId);
    setAddLeadError('');
    setPickFunnelId('');
    setFunnelsLoading(true);
    try {
      const res = await api.getLeadFunnels();
      setFunnels(res.funnels.map((f) => ({ id: f.id, name: f.name })));
      const preferred =
        postLeadFunnelId || (res.funnels.length === 1 ? res.funnels[0].id : '');
      if (preferred) setPickFunnelId(preferred);
    } catch (err) {
      setAddLeadError(parseApiError(err));
      setAddLeadCommentId(null);
    } finally {
      setFunnelsLoading(false);
    }
  };

  const confirmAddLead = async () => {
    if (!addLeadCommentId || !pickFunnelId) return;
    setAddLeadBusy(true);
    setAddLeadError('');
    try {
      const res = await api.createLead({
        socialCommentId: addLeadCommentId,
        funnelId: pickFunnelId,
      });
      if (res.lead?.id) {
        const from =
          findCommentBySocialId(comments, addLeadCommentId) ||
          ({ socialCommentId: addLeadCommentId, id: addLeadCommentId, username: null, fromId: null, text: '', replies: [] } as ListeningComment);
        patchLeadIdForCommenter(from, res.lead.id);
      }
      setAddLeadCommentId(null);
      invalidate();
    } catch (err) {
      setAddLeadError(parseApiError(err));
    } finally {
      setAddLeadBusy(false);
    }
  };

  if (!mediaId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-sm font-bold text-gray-500">Missing media id</p>
      </div>
    );
  }

  const preview = media?.mediaUrl || media?.thumbnailUrl;
  const commentClubs = useMemo(() => clubCommentsByUser(comments), [comments]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden bg-surface-muted p-3 md:p-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() =>
            navigate(
              instagramUserId
                ? `/social-listening/content?ig=${encodeURIComponent(instagramUserId)}`
                : '/social-listening/content'
            )
          }
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary"
        >
          ← Back to content
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {media?.permalink && (
            <a
              href={media.permalink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-xl border border-black/5 bg-surface px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-surface-muted"
            >
              Open on Instagram
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/5 bg-surface px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-surface-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <p className="shrink-0 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-600">
          {error}
        </p>
      )}

      {loading && !media ? (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          <div className="animate-pulse rounded-2xl border border-black/5 bg-surface" />
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-surface p-3.5">
            <div className="mb-2 h-4 w-24 animate-pulse rounded bg-slate-100" />
            <CommentsSkeleton />
          </section>
        </div>
      ) : media ? (
        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          {/* Post + agent settings */}
          <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <section className="flex shrink-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="relative flex h-44 shrink-0 items-center justify-center bg-[#0b1220] sm:h-52">
              {preview ? (
                media.mediaType === 'VIDEO' || media.isReel ? (
                  <video
                    src={media.mediaUrl || undefined}
                    poster={media.thumbnailUrl || undefined}
                    controls
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <img
                    src={preview}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#C13584]">
                  <Instagram className="h-8 w-8" />
                </div>
              )}
              {media.isReel && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Clapperboard className="h-3 w-3" />
                  Reel
                </span>
              )}
            </div>

            <div className="max-h-28 space-y-2 overflow-y-auto p-3.5">
              {media.caption && (
                <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap">
                  {media.caption}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  {formatCount(media.likeCount)} likes
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {formatCount(media.commentsCount)} comments
                </span>
                {media.timestamp && (
                  <span className="text-gray-400">{timeAgo(media.timestamp)} ago</span>
                )}
              </div>
            </div>
          </section>

          <div className="min-h-0 flex-1">
            <SocialListeningPostAgentPanel
              postId={mediaId}
              onSaved={(funnelId) => setPostLeadFunnelId(funnelId)}
            />
          </div>
          </div>

          {/* Comments card — scrolls inside */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-surface p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
              <h2 className="text-sm font-black text-gray-950">Comments</h2>
              <span className="text-[11px] font-bold text-gray-400">
                {commentsLoading ? 'Loading…' : `${comments.length} loaded`}
              </span>
            </div>

            {replyError && (
              <p className="mb-2 shrink-0 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-600">
                {replyError}
              </p>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {commentsLoading ? (
                <CommentsSkeleton />
              ) : comments.length === 0 ? (
                <div className="flex h-full min-h-[100px] items-center justify-center px-4 py-6">
                  <p className="text-center text-sm font-medium text-gray-500">
                    No comments on this post yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {commentClubs.map((club) => (
                    <CommentClub
                      key={club.key}
                      club={club}
                      replyToId={replyToId}
                      replyText={replyText}
                      replySending={replySending}
                      actionBusyId={actionBusyId}
                      addLeadBusyId={addLeadBusy ? addLeadCommentId : null}
                      onStartReply={(id, suggested) => {
                        setReplyToId(id);
                        setReplyText(suggested || '');
                        setPendingAction('approve_reply');
                        setReplyError('');
                      }}
                      onChangeReply={setReplyText}
                      onCancelReply={() => {
                        setReplyToId(null);
                        setReplyText('');
                        setPendingAction(null);
                        setReplyError('');
                      }}
                      onSendReply={() => void sendReply()}
                      onPrimaryAction={onPrimaryAction}
                      onIgnore={(c) => void runAction(c, 'ignore')}
                      onRetryClassify={(c) => {
                        if (!c.socialCommentId) return;
                        setActionBusyId(c.socialCommentId);
                        void api
                          .classifySocialListeningComment(c.socialCommentId)
                          .then(() => load({ quiet: true }))
                          .catch((err) => setReplyError(parseApiError(err)))
                          .finally(() => {
                            setActionBusyId(null);
                            invalidate();
                          });
                      }}
                      onRetryDm={(c) => {
                        if (!c.socialCommentId) return;
                        setActionBusyId(c.socialCommentId);
                        setReplyError('');
                        void api
                          .retrySocialListeningDm(c.socialCommentId, instagramUserId)
                          .then((res) => {
                            patchCommentStatus(c.socialCommentId!, c.status || 'replied', {
                              dmStatus: res.dmStatus,
                              dmError: res.dmError,
                              dmReplyText: res.dmReplyText,
                              dmSentAt:
                                res.dmStatus === 'sent'
                                  ? new Date().toISOString()
                                  : c.dmSentAt,
                            });
                            if (res.dmStatus === 'failed') {
                              setReplyError(
                                res.dmError ||
                                  'DM failed — comment may be outside Meta’s ~7 day window.'
                              );
                            }
                          })
                          .catch((err) => setReplyError(parseApiError(err)))
                          .finally(() => {
                            setActionBusyId(null);
                            invalidate();
                          });
                      }}
                      onAddLead={(c) => void openAddLead(c)}
                    />
                  ))}
                </div>
              )}
            </div>

            {nextCursor && (
              <div className="mt-3 flex shrink-0 justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => void loadMoreComments()}
                  className="rounded-xl border border-black/5 bg-surface-muted px-4 py-2 text-xs font-bold text-gray-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more comments'}
                </button>
              </div>
            )}
          </section>
        </div>
      ) : null}

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
                disabled={!pickFunnelId || addLeadBusy}
                onClick={() => void confirmAddLead()}
                className="cursor-pointer rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {addLeadBusy ? 'Adding…' : 'Add to lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
