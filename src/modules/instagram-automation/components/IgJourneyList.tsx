import { Loader2, MessageCircle, MessageSquare, Plus, Trash2, Workflow } from 'lucide-react';
import { IG_BTN_PRIMARY, IG_GRADIENT_SOFT } from '../igTheme';
import type { IgJourneyRecord } from '../types';

type Props = {
  journeys: IgJourneyRecord[];
  loading: boolean;
  onCreateBlank: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

function parseTriggerEvents(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function TriggerIcon({ event }: { event?: string | null }) {
  const events = parseTriggerEvents(event);
  if (events.includes('comment.received') && !events.includes('dm.received')) {
    return <MessageSquare className="h-4 w-4 text-[#833AB4]" strokeWidth={2.25} />;
  }
  // dm.received (default), multi, or anything else → message/DM
  return <MessageCircle className="h-4 w-4 text-[#833AB4]" strokeWidth={2.25} />;
}

function triggerLabel(event?: string | null) {
  const events = parseTriggerEvents(event);
  const hasDm = events.includes('dm.received');
  const hasComment = events.includes('comment.received');
  if (hasDm && hasComment) return 'DM + Comment';
  if (hasComment) return 'Comment';
  if (hasDm) return 'DM';
  return 'Trigger';
}

export function IgJourneyList({ journeys, loading, onCreateBlank, onOpen, onDelete }: Props) {
  return (
    <div className="space-y-5 ig-automation-module">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-black text-gray-950">Instagram Automation</h2>
          <p className="text-xs text-gray-500">
            Automate Instagram DMs and comment replies with triggers and quick replies.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateBlank}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${IG_BTN_PRIMARY}`}
        >
          <Plus className="h-4 w-4" />
          New automation
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-[#833AB4]" />
          Loading automations…
        </div>
      ) : journeys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-surface p-8 text-center">
          <div
            className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${IG_GRADIENT_SOFT}`}
          >
            <Workflow className="h-5 w-5 text-[#833AB4]" />
          </div>
          <p className="font-bold text-gray-900">No automations yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create your first Instagram DM or comment automation.
          </p>
          <button
            type="button"
            onClick={onCreateBlank}
            className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${IG_BTN_PRIMARY}`}
          >
            <Plus className="h-4 w-4" />
            New automation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {journeys.map((j) => {
            const published = j.status === 'published';
            return (
              <article
                key={j.id}
                className="group flex items-stretch overflow-hidden rounded-xl border border-black/5 bg-surface transition-shadow hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onOpen(j.id)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2.5 text-left"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${IG_GRADIENT_SOFT}`}
                    title={triggerLabel(j.triggerEvent)}
                  >
                    <TriggerIcon event={j.triggerEvent} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-gray-950 group-hover:text-[#833AB4]">
                        {j.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                          published
                            ? `${IG_GRADIENT_SOFT} text-[#833AB4]`
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {j.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                      {triggerLabel(j.triggerEvent)}
                      <span className="mx-1 text-gray-300">·</span>
                      {j._count?.nodes ?? 0} steps
                      <span className="mx-1 text-gray-300">·</span>
                      {j._count?.executions ?? 0} runs
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(j.id)}
                  className="shrink-0 cursor-pointer border-l border-black/5 px-2.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                  aria-label={`Delete ${j.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
