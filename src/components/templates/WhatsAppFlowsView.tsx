/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Loader2, LayoutGrid } from 'lucide-react';
import { api } from '../../lib/api';
import { pathForTemplateEditor } from '../../routes';

export type WhatsAppFlowRecord = {
  id: string;
  name: string;
  status: string;
  categories: string[];
  updatedAt: string;
};

function formatUpdated(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: string }) {
  const isPublished = status === 'published';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
        isPublished ? 'bg-[#e6f7ec] text-channel-green' : 'bg-slate-100 text-gray-500'
      }`}
    >
      {isPublished ? 'Published' : 'Draft'}
    </span>
  );
}

export const WhatsAppFlowsView: React.FC = () => {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<WhatsAppFlowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = (await api.listWhatsAppFlows()) as { items?: WhatsAppFlowRecord[] };
      setFlows(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDelete = async (flow: WhatsAppFlowRecord) => {
    if (!window.confirm(`Delete "${flow.name}"? This cannot be undone.`)) return;
    setDeletingId(flow.id);
    try {
      await api.deleteWhatsAppFlow(flow.id);
      setFlows((prev) => prev.filter((f) => f.id !== flow.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete flow');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = flows.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="p-4 bg-white ring-1 ring-slate-200/80 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flows..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-meta font-semibold outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={() => navigate(pathForTemplateEditor('flow', null))}
          className="px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-meta font-bold flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Create flow
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-24 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-gray-400">
            <LayoutGrid className="w-10 h-10" />
            <p className="text-sm font-semibold">
              {flows.length === 0 ? 'No flows yet' : 'No flows match your search'}
            </p>
            <p className="text-xs max-w-sm">
              Flows are interactive multi-screen forms for booking, surveys, or lead capture —
              authored here, sent later from templates, journeys, or the inbox.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((flow) => (
              <article
                key={flow.id}
                className="bg-white rounded-2xl border border-black/5 p-4 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black text-gray-950 leading-tight break-words">
                    {flow.name}
                  </h3>
                  <StatusBadge status={flow.status} />
                </div>
                <p className="text-xs text-gray-400 font-medium">
                  Updated {formatUpdated(flow.updatedAt)}
                </p>
                <div className="mt-auto flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate(pathForTemplateEditor('flow', flow.id))}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-black/5 bg-white text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === flow.id}
                    onClick={() => void handleDelete(flow)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    {deletingId === flow.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
