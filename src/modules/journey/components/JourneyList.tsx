import {
  LayoutGrid,
  Loader2,
  MessageCircle,
  Plus,
  Tag,
  Trash2,
  UserPlus,
  Workflow,
} from 'lucide-react';
import type { JourneyRecord } from '../types';

type Props = {
  journeys: JourneyRecord[];
  loading: boolean;
  onCreateBlank: () => void;
  onOpenGallery: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

function TriggerIcon({ event }: { event?: string | null }) {
  if (event === 'contact.created') {
    return <UserPlus className="h-4 w-4 text-primary" strokeWidth={2.25} />;
  }
  if (event === 'contact.tag_added') {
    return <Tag className="h-4 w-4 text-primary" strokeWidth={2.25} />;
  }
  // message.received / conversation.opened / manual → message
  return <MessageCircle className="h-4 w-4 text-primary" strokeWidth={2.25} />;
}

function triggerLabel(event?: string | null) {
  if (event === 'contact.created') return 'Contact created';
  if (event === 'contact.tag_added') return 'Tag added';
  if (event === 'message.received') return 'Message';
  if (event === 'conversation.opened') return 'Conversation';
  if (event === 'manual') return 'Manual';
  return 'Trigger';
}

export function JourneyList({
  journeys,
  loading,
  onCreateBlank,
  onOpenGallery,
  onOpen,
  onDelete,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-gray-950">WhatsApp Automation</h2>
          <p className="text-xs text-swiss-muted">
            Automate WhatsApp workflows with triggers, delays, and branches.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenGallery}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <LayoutGrid className="h-4 w-4" />
            Gallery
          </button>
          <button
            type="button"
            onClick={onCreateBlank}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            New journey
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-swiss-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading journeys…
        </div>
      ) : journeys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center">
          <Workflow className="mx-auto mb-3 h-7 w-7 text-primary" />
          <p className="font-bold text-swiss-ink">No journeys yet</p>
          <p className="mt-1 text-sm text-swiss-muted">
            Browse the gallery for starters, or create a blank journey.
          </p>
          <button
            type="button"
            onClick={onOpenGallery}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10"
          >
            <LayoutGrid className="h-4 w-4" />
            Open gallery
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {journeys.map((j) => {
            const published = j.status === 'published';
            return (
              <article
                key={j.id}
                className="group flex items-stretch overflow-hidden bg-white border border-swiss-line transition-shadow "
              >
                <button
                  type="button"
                  onClick={() => onOpen(j.id)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2.5 text-left"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                    title={triggerLabel(j.triggerEvent)}
                  >
                    <TriggerIcon event={j.triggerEvent} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-gray-950 group-hover:text-primary">
                        {j.name}
                      </h3>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                          published
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-100 text-swiss-muted'
                        }`}
                      >
                        {j.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-medium text-swiss-faint">
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
                  className="shrink-0 cursor-pointer border-l border-swiss-line px-2.5 text-swiss-faint transition-colors hover:bg-rose-50 hover:text-rose-600"
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
