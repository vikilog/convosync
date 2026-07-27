import { LayoutGrid, Loader2, Plus, Trash2, Workflow } from 'lucide-react';
import type { JourneyRecord } from '../types';

type Props = {
  journeys: JourneyRecord[];
  loading: boolean;
  onCreateBlank: () => void;
  onOpenGallery: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

export function JourneyList({
  journeys,
  loading,
  onCreateBlank,
  onOpenGallery,
  onOpen,
  onDelete,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-black text-gray-950">Journeys</h2>
          <p className="text-xs text-gray-500">
            Automate WhatsApp workflows with triggers, delays, and branches.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenGallery}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
          >
            <LayoutGrid className="w-4 h-4" />
            Gallery
          </button>
          <button
            type="button"
            onClick={onCreateBlank}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            New journey
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading journeys…
        </div>
      ) : journeys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-surface p-10 text-center">
          <Workflow className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="font-bold text-gray-900">No journeys yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Browse the gallery for starters, or create a blank journey.
          </p>
          <button
            type="button"
            onClick={onOpenGallery}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10"
          >
            <LayoutGrid className="w-4 h-4" />
            Open gallery
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-black/5 bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Steps</th>
                <th className="px-4 py-3 font-bold">Runs</th>
                <th className="px-4 py-3 font-bold" />
              </tr>
            </thead>
            <tbody>
              {journeys.map((j) => (
                <tr key={j.id} className="border-t border-black/5 hover:bg-surface-muted">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onOpen(j.id)}
                      className="font-bold text-primary hover:underline text-left"
                    >
                      {j.name}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-black uppercase px-2 py-0.5 rounded-full ${
                        j.status === 'published'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{j._count?.nodes ?? 0}</td>
                  <td className="px-4 py-3 text-gray-600">{j._count?.executions ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(j.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
