import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  Eye,
  Facebook,
  Instagram,
  MessageCircle,
  Send,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { pathForTab } from '../../routes';
import { IGNORE_BTN_CLASS, primaryActionFor, REVIEW_CARD_SHELL, SECTION_THEMES } from './intentConfig';
import type { ReviewComment, TriageSectionId } from './types';
import { timeAgo } from '../leads/types';

export const ReviewCard: React.FC<{
  item: ReviewComment;
  sectionId: TriageSectionId;
  onPrimary: (id: string) => void;
  onIgnore: (id: string) => void;
  /** In detail drawer, low-confidence primary becomes "Mark handled" */
  detailMode?: boolean;
  /** Handled history: no approve/ignore — optional Add to lead */
  hideQueueActions?: boolean;
  onAddLead?: (id: string) => void;
  addLeadBusy?: boolean;
}> = ({
  item,
  sectionId,
  onPrimary,
  onIgnore,
  detailMode,
  hideQueueActions,
  onAddLead,
  addLeadBusy,
}) => {
  const theme = SECTION_THEMES[sectionId];
  const action = primaryActionFor(sectionId);
  const confidencePct = Math.round(item.confidence * 100);
  const isPending = item.status === 'pending';
  const muted = theme.muted && !detailMode;
  const hasLead = Boolean(item.leadId);

  const label =
    detailMode && action.kind === 'review' ? 'Mark handled' : action.label;

  const PrimaryIcon =
    action.kind === 'escalate'
      ? AlertTriangle
      : action.kind === 'review' && !detailMode
        ? Eye
        : Check;

  const publicReply = item.publicReplyText?.trim() || null;
  const dmReply = item.dmReplyText?.trim() || null;
  const draftReply = item.suggestedDm?.trim() || null;
  const publicDraft = publicReply ? null : draftReply;
  const dmSent = item.dmStatus === 'sent' && Boolean(dmReply);
  const dmFailed = item.dmStatus === 'failed';
  const showDmDraft =
    !dmReply &&
    Boolean(draftReply) &&
    (action.kind === 'approve_dm' || sectionId === 'sales');
  const showPublicDraft =
    Boolean(publicDraft) && !(showDmDraft && action.kind === 'approve_dm');
  const showPublicBlock = Boolean(publicReply) || (showPublicDraft && !showDmDraft);
  const showDmBlock = dmSent || dmFailed || showDmDraft || Boolean(dmReply);

  const showActions =
    !hideQueueActions || Boolean(onAddLead) || hasLead;

  return (
    <article
      className={`${REVIEW_CARD_SHELL} border-l-[3px] ${theme.accentBorder} ${
        muted ? 'opacity-90' : ''
      }`}
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start gap-3">
            {item.profilePicUrl ? (
              <img
                src={item.profilePicUrl}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full object-cover border border-black/5"
              />
            ) : item.platform === 'facebook' ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f4ff] text-[#1877F2]">
                <Facebook className="h-4 w-4" aria-hidden />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fce8f0] text-[#C13584]">
                <Instagram className="h-4 w-4" aria-hidden />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-sm font-bold text-[#0F172A]">@{item.username}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${theme.accentBg} ${theme.accentText}`}
                >
                  <Sparkles className="h-3 w-3" aria-hidden />
                  {item.intent} · {confidencePct}%
                </span>
                {item.status !== 'pending' && (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {item.status}
                  </span>
                )}
                {hasLead && (
                  <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                    Lead
                  </span>
                )}
                <span className="text-xs font-medium text-slate-500">
                  {timeAgo(item.createdAt)}
                </span>
              </div>

              <p
                className={`mt-2 whitespace-pre-wrap leading-relaxed text-[#0F172A] ${
                  muted ? 'text-sm' : 'text-[15px] font-medium'
                }`}
              >
                {item.commentText || '(empty comment)'}
              </p>
            </div>
          </div>

          {!muted && (
            <div className="flex items-center gap-2.5 pl-[52px]">
              <img
                src={item.postThumbnailUrl}
                alt=""
                className="h-9 w-9 shrink-0 rounded-md object-cover border border-black/5"
              />
              <p className="min-w-0 truncate text-xs text-slate-500">
                {item.postCaption || (item.platform === 'facebook' ? 'Facebook post' : 'Instagram post')}
              </p>
            </div>
          )}

          {(showPublicBlock || showDmBlock) && (
            <div className="space-y-2 pl-[52px]">
              {showPublicBlock && (
                <div className="border-l-2 border-slate-200 pl-3">
                  <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                    <MessageCircle className="h-3 w-3" aria-hidden />
                    {publicReply ? 'Public reply sent' : 'Suggested public reply'}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {publicReply || publicDraft}
                  </p>
                </div>
              )}

              {showDmBlock && (
                <div
                  className={`border-l-2 pl-3 ${
                    dmFailed ? 'border-amber-400' : 'border-slate-200'
                  }`}
                >
                  <p
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                      dmFailed ? 'text-amber-800' : 'text-slate-500'
                    }`}
                  >
                    <Send className="h-3 w-3" aria-hidden />
                    {dmFailed
                      ? 'DM failed'
                      : dmSent || (dmReply && item.dmStatus === 'sent')
                        ? `DM sent${item.dmSentAt ? ` · ${timeAgo(item.dmSentAt)}` : ''}`
                        : dmReply
                          ? 'DM'
                          : 'Suggested DM'}
                  </p>
                  {(dmReply || (showDmDraft && draftReply)) && (
                    <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {dmReply || draftReply}
                    </p>
                  )}
                  {dmFailed && (
                    <p className="mt-1 text-xs font-medium text-amber-800">
                      Outside Meta’s ~7 day private-reply window
                      {item.dmError ? ` — ${item.dmError}` : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex shrink-0 flex-row gap-2 sm:w-[168px] sm:flex-col sm:items-stretch">
            {hideQueueActions ? (
              hasLead ? (
                <Link
                  to={pathForTab('leads')}
                  className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-sm font-bold text-sky-700 transition-colors duration-200 hover:bg-sky-500/15"
                >
                  View lead
                </Link>
              ) : onAddLead ? (
                <button
                  type="button"
                  disabled={addLeadBusy}
                  onClick={() => onAddLead(item.id)}
                  className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-700 transition-colors duration-200 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {addLeadBusy ? 'Adding…' : 'Add to lead'}
                </button>
              ) : null
            ) : (
              <>
                <button
                  type="button"
                  disabled={!isPending}
                  onClick={() => onPrimary(item.id)}
                  className={`inline-flex min-h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`}
                >
                  <PrimaryIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                </button>
                <button
                  type="button"
                  disabled={!isPending}
                  onClick={() => onIgnore(item.id)}
                  className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-full ${IGNORE_BTN_CLASS}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Ignore
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
