import React from 'react';
import type { TriageSectionId } from './types';
import { SECTION_ORDER, SECTION_THEMES } from './intentConfig';

export type IntentCounts = Record<TriageSectionId, number>;

export const SummaryStrip: React.FC<{
  pendingTotal: number;
  counts: IntentCounts;
}> = ({ pendingTotal, counts }) => {
  const pills = SECTION_ORDER.filter((id) => counts[id] > 0).map((id) => {
    const theme = SECTION_THEMES[id];
    const short =
      id === 'sales'
        ? 'Sales'
        : id === 'questions'
          ? 'Questions'
          : id === 'complaints'
            ? 'Complaints'
            : 'Unclear';
    return { id, short, count: counts[id], theme };
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-xl bg-[#0F172A] px-3 py-1.5 text-xs font-bold text-white">
        {pendingTotal} pending
      </span>
      {pills.map((p) => (
        <span
          key={p.id}
          className={`inline-flex items-center gap-1.5 rounded-full border border-swiss-line px-2.5 py-1 text-[11px] font-bold ${p.theme.accentBg} ${p.theme.accentText}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${p.theme.accentDot}`} />
          {p.count} {p.short}
        </span>
      ))}
    </div>
  );
};
