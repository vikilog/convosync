import { Loader2, Plus, Trash2, Workflow } from 'lucide-react';
import type { JourneyRecord } from '../types';

type Props = {
  journeys: JourneyRecord[];
  loading: boolean;
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
};

export function JourneyList({ journeys, loading, onCreate, onOpen, onDelete }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-950">Journeys</h2>
          <p className="text-xs text-gray-500">Automate WhatsApp workflows with triggers, delays, and branches.</p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          <Plus className="w-4 h-4" />
          New journey
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading journeys…
        </div>
      ) : journeys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Workflow className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="font-bold text-gray-900">No journeys yet</p>
          <p className="text-sm text-gray-500 mt-1">Create your first automation workflow.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-gray-400">
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
                <tr key={j.id} className="border-t border-slate-200 hover:bg-slate-50">
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
                          ? 'bg-emerald-50 text-emerald-700'
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
