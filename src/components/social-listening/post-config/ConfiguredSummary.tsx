import React from 'react';
import { Pencil } from 'lucide-react';
import {
  funnelName,
  skillTitle,
  toneLabel,
  type PostConfigValues,
} from './mockPostConfig';

export function ConfiguredSummary({
  values,
  onEdit,
}: {
  values: PostConfigValues;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">
            Configured
          </p>
          <p className="mt-1 text-sm font-bold text-gray-900">
            <span className="text-emerald-800">{funnelName(values.funnelId)}</span>
            <span className="font-medium text-gray-400"> · </span>
            <span>{skillTitle(values.skillId)}</span>
            <span className="font-medium text-gray-400"> · </span>
            <span>{toneLabel(values.tone)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-surface-muted"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </button>
      </div>
    </section>
  );
}
