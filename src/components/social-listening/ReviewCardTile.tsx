import React from 'react';
import {
  AlertTriangle,
  Check,
  Eye,
  Facebook,
  Instagram,
  Sparkles,
  X,
} from 'lucide-react';
import { IGNORE_BTN_CLASS, primaryActionFor, REVIEW_CARD_SHELL, SECTION_THEMES } from './intentConfig';
import type { ReviewComment, TriageSectionId } from './types';
import { timeAgo } from '../leads/types';

/** Compact grid tile for Card view mode. */
export const ReviewCardTile: React.FC<{
  item: ReviewComment;
  sectionId: TriageSectionId;
  onPrimary: (id: string) => void;
  onIgnore: (id: string) => void;
  onOpen: (id: string) => void;
}> = ({ item, sectionId, onPrimary, onIgnore, onOpen }) => {
  const theme = SECTION_THEMES[sectionId];
  const action = primaryActionFor(sectionId);
  const confidencePct = Math.round(item.confidence * 100);
  const isPending = item.status === 'pending';

  const PrimaryIcon =
    action.kind === 'escalate' ? AlertTriangle : action.kind === 'review' ? Eye : Check;

  const topBorder =
    sectionId === 'complaints'
      ? 'border-l-orange-500'
      : sectionId === 'sales'
        ? 'border-l-emerald-500'
        : sectionId === 'questions'
          ? 'border-l-sky-500'
          : 'border-l-slate-300';

  return (
    <article
      className={`flex gap-2.5 overflow-hidden p-2.5 border-l-[3px] ${REVIEW_CARD_SHELL} ${topBorder}`}
    >
      <button
        type="button"
        onClick={() => onOpen(item.id)}
        className="shrink-0 cursor-pointer"
      >
        <img
          src={item.postThumbnailUrl}
          alt=""
          className="h-14 w-14 rounded-lg object-cover border border-black/5"
        />
      </button>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-1.5">
          {item.profilePicUrl ? (
            <img
              src={item.profilePicUrl}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : item.platform === 'facebook' ? (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f4ff] text-[#1877F2]">
              <Facebook className="h-2.5 w-2.5" />
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#fce8f0] text-[#C13584]">
              <Instagram className="h-2.5 w-2.5" />
            </div>
          )}
          <span className="truncate text-sm font-bold text-neutral-900">
            @{item.username}
          </span>
          <span className="shrink-0 text-[11px] text-neutral-400">
            {timeAgo(item.createdAt)}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-semibold ${theme.accentBg} ${theme.accentText}`}
        >
          <Sparkles className="h-2.5 w-2.5" />
          {item.intent} · {confidencePct}%
        </span>

        <button
          type="button"
          onClick={() => onOpen(item.id)}
          className="line-clamp-2 w-full cursor-pointer text-left text-xs font-medium leading-snug text-[#0F172A]"
        >
          {item.commentText}
        </button>

        <div className="flex gap-1.5 pt-0.5">
          <button
            type="button"
            disabled={!isPending}
            onClick={() => onPrimary(item.id)}
            className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 ${action.className}`}
          >
            <PrimaryIcon className="h-3 w-3" />
            <span className="truncate">{action.label}</span>
          </button>
          <button
            type="button"
            disabled={!isPending}
            onClick={() => onIgnore(item.id)}
            title="Ignore"
            className={`inline-flex cursor-pointer items-center justify-center rounded-lg px-1.5 py-1 disabled:cursor-not-allowed disabled:opacity-50 ${IGNORE_BTN_CLASS}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
};
