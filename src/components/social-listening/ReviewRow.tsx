import React from 'react';
import { Facebook, Instagram, Sparkles } from 'lucide-react';
import { REVIEW_CARD_SHELL, SECTION_THEMES } from './intentConfig';
import type { ReviewComment, TriageSectionId } from './types';
import { timeAgo } from '../leads/types';

export const ReviewRow: React.FC<{
  item: ReviewComment;
  sectionId: TriageSectionId;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}> = ({ item, sectionId, selected, onToggleSelect, onOpen }) => {
  const theme = SECTION_THEMES[sectionId];
  const confidencePct = Math.round(item.confidence * 100);
  const isPending = item.status === 'pending';

  return (
    <div
      className={`flex min-h-12 items-center gap-3 border-l-[3px] px-3 py-2.5 transition-colors duration-200 ${REVIEW_CARD_SHELL} ${theme.accentBorder} ${
        selected ? 'ring-2 ring-sky-500/25' : 'hover:bg-surface-muted/40'
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        disabled={!isPending}
        onChange={() => onToggleSelect(item.id)}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-[#0EA5E9] focus:ring-[#0EA5E9]/30 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={`Select @${item.username}`}
      />

      {item.profilePicUrl ? (
        <img
          src={item.profilePicUrl}
          alt=""
          className="h-8 w-8 shrink-0 rounded-full object-cover border border-black/5"
        />
      ) : item.platform === 'facebook' ? (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8f4ff] text-[#1877F2]">
          <Facebook className="h-3.5 w-3.5" />
        </div>
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fce8f0] text-[#C13584]">
          <Instagram className="h-3.5 w-3.5" />
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpen(item.id)}
        className="min-w-0 flex-1 cursor-pointer text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-[#0F172A]">@{item.username}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${theme.accentBg} ${theme.accentText}`}
          >
            <Sparkles className="h-2.5 w-2.5" />
            {item.intent} · {confidencePct}%
          </span>
          <span className="text-[11px] text-gray-400">{timeAgo(item.createdAt)}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-600">{item.commentText}</p>
      </button>
    </div>
  );
};
