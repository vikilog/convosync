/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Search, Table2, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { CreateDataTableModal } from './CreateDataTableModal';
import { DataTableDetailView } from './DataTableDetailView';
import type { DataTableRecord } from './types';
import { Input } from '../ui/input';

function formatUpdated(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export function DataTablesView() {
  const [tables, setTables] = useState<DataTableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = (await api.listDataTables()) as { items?: DataTableRecord[] };
      setTables(res.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (openId) {
    return (
      <DataTableDetailView
        tableId={openId}
        onBack={() => {
          setOpenId(null);
          void load();
        }}
      />
    );
  }

  const handleDelete = async (table: DataTableRecord) => {
    if (!window.confirm(`Delete "${table.name}"? This cannot be undone.`)) return;
    setDeletingId(table.id);
    try {
      await api.deleteDataTable(table.id);
      setTables((prev) => prev.filter((t) => t.id !== table.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete table');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 font-swiss">
      <div className="p-4 bg-white border border-swiss-line flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-swiss-faint" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tables..."
            className="h-auto w-full bg-white border border-swiss-line rounded-xl py-1.5 pl-9 pr-3 text-meta font-semibold outline-none focus:ring-2 focus:ring-swiss-accent/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="px-3 py-2 bg-swiss-accent hover:bg-swiss-accent-hover text-white rounded-xl text-meta font-bold flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New table
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-24 text-swiss-faint">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center text-swiss-faint">
            <Table2 className="w-10 h-10" />
            <p className="text-sm font-semibold">
              {tables.length === 0 ? 'No tables yet' : 'No tables match your search'}
            </p>
            <p className="text-xs max-w-sm">
              Design a table with your own columns, then connect it to a Flow so submissions land
              here automatically — or enter data by hand.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((table) => (
              <article
                key={table.id}
                onClick={() => setOpenId(table.id)}
                className="cursor-pointer bg-white rounded-2xl border border-swiss-line p-4 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-swiss-accent/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-950 leading-tight break-words">
                    {table.name}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-bold text-swiss-muted">
                    {table.rowCount} row{table.rowCount === 1 ? '' : 's'}
                  </span>
                </div>
                {table.description ? (
                  <p className="text-xs text-swiss-muted line-clamp-2">{table.description}</p>
                ) : null}
                <p className="text-xs text-swiss-faint font-medium">
                  {table.columns.length} column{table.columns.length === 1 ? '' : 's'} · Updated{' '}
                  {formatUpdated(table.updatedAt)}
                </p>
                <div className="mt-auto flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={deletingId === table.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleDelete(table);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    {deletingId === table.id ? (
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

      <CreateDataTableModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(table) => {
          setTables((prev) => [table, ...prev]);
          setOpenId(table.id);
        }}
      />
    </div>
  );
}
