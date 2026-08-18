import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import type { TriageSectionId } from './types';
import { SECTION_THEMES } from './intentConfig';

export const BulkActionBar: React.FC<{
  selectedCount: number;
  /** null when mixed intents selected */
  unifiedSection: TriageSectionId | null;
  /** true while a queued action for the current selection is in flight */
  busy?: boolean;
  onApprove: () => void;
  onIgnore: () => void;
  onClear: () => void;
}> = ({ selectedCount, unifiedSection, busy, onApprove, onIgnore, onClear }) => {
  if (selectedCount === 0) return null;

  const mixed = unifiedSection === null;
  const theme = unifiedSection ? SECTION_THEMES[unifiedSection] : null;
  const approveLabel =
    unifiedSection === 'complaints'
      ? 'Escalate Selected'
      : unifiedSection === 'questions'
        ? 'Approve & Reply Selected'
        : unifiedSection === 'low_confidence'
          ? 'Review Selected'
          : 'Approve Selected';

  return (
    <div className="sticky bottom-3 z-20 mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#0F172A] px-4 py-3 text-white shadow-xl shadow-slate-900/20">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span>{selectedCount} selected</span>
        {theme ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${theme.accentBg} ${theme.accentText}`}
          >
            {theme.label}
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-200"
            title="Select items of the same intent type to bulk-approve"
          >
            <AlertCircle className="h-3 w-3" />
            Mixed intents — bulk approve disabled
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onClear}
          className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onIgnore}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" />
          {busy ? 'Working…' : `Ignore Selected (${selectedCount})`}
        </button>
        <span className="relative inline-flex">
          <button
            type="button"
            disabled={mixed || busy}
            onClick={onApprove}
            title={
              mixed
                ? 'Bulk approve only works when all selected items share the same intent'
                : undefined
            }
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
              mixed
                ? 'bg-white/20 text-white'
                : 'bg-[#0EA5E9] text-white hover:bg-[#0284c7]'
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            {busy ? 'Working…' : `${approveLabel} (${selectedCount})`}
          </button>
        </span>
      </div>
    </div>
  );
};
