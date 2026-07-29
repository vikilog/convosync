import React from 'react';
import { AlertTriangle, Check, Loader2, Sparkles } from 'lucide-react';
import type { AiSuggestionSet, ScanUiState } from './mockPostConfig';

function SuggestionRow({
  label,
  pill,
  reason,
  onApply,
}: {
  label: string;
  pill: string;
  reason: string;
  onApply: () => void;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              {label}
            </span>
            <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[11px] font-bold text-cyan-800">
              {pill}
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-400">{reason}</p>
        </div>
        <button
          type="button"
          onClick={onApply}
          className="shrink-0 cursor-pointer rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-700 hover:bg-cyan-500/15"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

export function AISuggestionCard({
  state,
  suggestions,
  onUseAll,
  onConfigureManually,
  onApplyFunnel,
  onApplySkill,
  onApplyTone,
  onRetry,
}: {
  state: ScanUiState;
  suggestions: AiSuggestionSet;
  onUseAll: () => void;
  onConfigureManually: () => void;
  onApplyFunnel: () => void;
  onApplySkill: () => void;
  onApplyTone: () => void;
  onRetry: () => void;
}) {
  if (state === 'scanning') {
    return (
      <section className="rounded-2xl border border-black/5 bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
          AI Suggestion
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-600" />
          Analyzing post content…
        </div>
        <div className="mt-4 space-y-2.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-black/5 bg-surface-muted/60 p-3">
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="mt-2 h-3 w-full max-w-[90%] rounded bg-slate-50" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (state === 'failed') {
    return (
      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
          AI Suggestion
        </div>
        <div className="mt-3 flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-amber-950">Couldn&apos;t analyze this post</p>
            <p className="mt-0.5 text-xs text-amber-800/80">
              You can still configure funnel, skill, and tone manually below.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-amber-300/80 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50"
            >
              Retry Scan
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
          AI Suggestion
        </div>
        <span className="text-[11px] font-medium text-gray-400">{suggestions.scannedAtLabel}</span>
      </div>

      <div className="mt-3 space-y-2">
        <SuggestionRow
          label="Suggested Funnel"
          pill={suggestions.funnel.name}
          reason={suggestions.funnel.reason}
          onApply={onApplyFunnel}
        />
        <SuggestionRow
          label="Suggested Agent Skill"
          pill={suggestions.skill.title}
          reason={suggestions.skill.reason}
          onApply={onApplySkill}
        />
        <SuggestionRow
          label="Suggested Reply Tone"
          pill={suggestions.tone.label}
          reason={suggestions.tone.reason}
          onApply={onApplyTone}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUseAll}
          className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-cyan-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 sm:flex-none"
        >
          Use All Suggestions
        </button>
        <button
          type="button"
          onClick={onConfigureManually}
          className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-black/10 bg-transparent px-3 py-2.5 text-xs font-bold text-gray-600 hover:bg-surface-muted"
        >
          Configure Manually
        </button>
      </div>
    </section>
  );
}
