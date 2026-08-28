import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { TriageSectionId } from './types';
import { SECTION_THEMES } from './intentConfig';

export const IntentSection: React.FC<{
  sectionId: TriageSectionId;
  count: number;
  children: React.ReactNode;
  /** Override default collapsed from theme */
  forceExpanded?: boolean;
}> = ({ sectionId, count, children, forceExpanded }) => {
  const theme = SECTION_THEMES[sectionId];
  const [open, setOpen] = useState(
    forceExpanded ?? !theme.defaultCollapsed
  );

  if (count === 0) return null;

  return (
    <section
      className={`bg-white border border-swiss-line overflow-hidden ${
        theme.muted ? 'opacity-90' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full cursor-pointer items-center justify-between gap-3 border-l-4 px-4 py-3 text-left ${theme.accentBorder} ${theme.headerBg}`}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className={`h-4 w-4 ${theme.accentText}`} />
          ) : (
            <ChevronRight className={`h-4 w-4 ${theme.accentText}`} />
          )}
          <span className={`text-sm font-black ${theme.accentText}`}>
            {theme.label}
          </span>
          <span
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${theme.accentBg} ${theme.accentText}`}
          >
            {count}
          </span>
        </div>
        {!open && theme.muted ? (
          <span className="text-[11px] font-semibold text-slate-400">
            Show {count} more
          </span>
        ) : null}
      </button>
      {open ? <div className="space-y-3 p-3 md:p-4">{children}</div> : null}
    </section>
  );
};
