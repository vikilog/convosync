/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { ArrowLeft, Link2, Loader2, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import { ConnectFlowModal } from './ConnectFlowModal';
import { DATA_COLUMN_TYPE_OPTIONS, type DataColumnType, type DataTableRecord, type DataTableRow } from './types';

type Props = { tableId: string; onBack: () => void };

function formatCell(value: unknown, type: DataColumnType): string {
  if (value === null || value === undefined || value === '') return '';
  if (type === 'boolean') return value === true || value === 'true' ? 'Yes' : 'No';
  return String(value);
}

export function DataTableDetailView({ tableId, onBack }: Props) {
  const [table, setTable] = useState<DataTableRecord | null>(null);
  const [rows, setRows] = useState<DataTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectOpen, setConnectOpen] = useState(false);

  const [addingColumn, setAddingColumn] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<DataColumnType>('text');
  const [newColOptions, setNewColOptions] = useState('');
  const [savingColumn, setSavingColumn] = useState(false);

  const [addingRow, setAddingRow] = useState(false);
  const [editing, setEditing] = useState<{ rowId: string; key: string } | null>(null);
  const [cellDraft, setCellDraft] = useState('');
  const cellInputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tableRes, rowsRes] = await Promise.all([
        api.getDataTable(tableId) as Promise<{ item: DataTableRecord }>,
        api.listDataTableRows(tableId) as Promise<{ items: DataTableRow[] }>,
      ]);
      setTable(tableRes.item);
      setRows(rowsRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table');
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (editing) cellInputRef.current?.focus();
  }, [editing]);

  const handleAddColumn = async () => {
    const label = newColLabel.trim();
    if (!label || !table) return;
    setSavingColumn(true);
    setError('');
    try {
      const res = (await api.addDataTableColumn(tableId, {
        label,
        type: newColType,
        options:
          newColType === 'select'
            ? newColOptions
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined,
      })) as { item: DataTableRecord['columns'][number] };
      setTable({ ...table, columns: [...table.columns, res.item] });
      setAddingColumn(false);
      setNewColLabel('');
      setNewColType('text');
      setNewColOptions('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add column');
    } finally {
      setSavingColumn(false);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!table) return;
    if (!window.confirm('Delete this column? Data in it will be lost.')) return;
    try {
      await api.deleteDataTableColumn(tableId, columnId);
      setTable({ ...table, columns: table.columns.filter((c) => c.id !== columnId) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete column');
    }
  };

  const handleAddRow = async () => {
    setAddingRow(true);
    setError('');
    try {
      const res = (await api.createDataTableRow(tableId, {})) as { item: DataTableRow };
      setRows((prev) => [res.item, ...prev]);
      if (table) setTable({ ...table, rowCount: table.rowCount + 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add row');
    } finally {
      setAddingRow(false);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm('Delete this row?')) return;
    try {
      await api.deleteDataTableRow(tableId, rowId);
      setRows((prev) => prev.filter((r) => r.id !== rowId));
      if (table) setTable({ ...table, rowCount: Math.max(0, table.rowCount - 1) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete row');
    }
  };

  const commitCell = async () => {
    if (!editing) return;
    const { rowId, key } = editing;
    const value = cellDraft;
    setEditing(null);
    try {
      const res = (await api.updateDataTableRow(tableId, rowId, { [key]: value })) as {
        item: DataTableRow;
      };
      setRows((prev) => prev.map((r) => (r.id === rowId ? res.item : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cell');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <p className="text-sm text-red-600">{error || 'Table not found'}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All tables
          </button>
          <h2 className="text-lg font-black text-gray-950 truncate">{table.name}</h2>
          {table.description ? <p className="text-xs text-gray-500">{table.description}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => setConnectOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-black/5 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-surface-muted"
        >
          <Link2 className="w-3.5 h-3.5" />
          Connect a Flow
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-black/5 bg-white">
        <table className="min-w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr>
              <th className="w-9 border-b border-r border-black/5 px-2 py-2" />
              {table.columns.map((col) => (
                <th
                  key={col.id}
                  className="border-b border-r border-black/5 px-3 py-2 text-left text-xs font-bold text-gray-600 whitespace-nowrap group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{col.label}</span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteColumn(col.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600"
                      aria-label={`Delete column ${col.label}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="border-b border-black/5 px-2 py-2 min-w-[140px]">
                {addingColumn ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={newColLabel}
                      onChange={(e) => setNewColLabel(e.target.value)}
                      placeholder="Column name"
                      className="w-28 rounded-lg border border-black/5 px-2 py-1 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <select
                      value={newColType}
                      onChange={(e) => setNewColType(e.target.value as DataColumnType)}
                      className="rounded-lg border border-black/5 px-1.5 py-1 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {DATA_COLUMN_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {newColType === 'select' ? (
                      <input
                        value={newColOptions}
                        onChange={(e) => setNewColOptions(e.target.value)}
                        placeholder="a, b, c"
                        className="w-20 rounded-lg border border-black/5 px-2 py-1 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    ) : null}
                    <button
                      type="button"
                      disabled={savingColumn}
                      onClick={() => void handleAddColumn()}
                      className="rounded-lg bg-primary px-2 py-1 text-xs font-bold text-white disabled:opacity-50"
                    >
                      {savingColumn ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingColumn(false)}
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingColumn(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Column
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="group hover:bg-slate-50/60">
                <td className="border-b border-r border-black/5 px-2 py-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => void handleDeleteRow(row.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600"
                    aria-label="Delete row"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
                {table.columns.map((col) => {
                  const isEditing = editing?.rowId === row.id && editing.key === col.key;
                  return (
                    <td
                      key={col.id}
                      onClick={() => {
                        if (isEditing) return;
                        setEditing({ rowId: row.id, key: col.key });
                        setCellDraft(formatCell(row.data[col.key], col.type) || String(row.data[col.key] ?? ''));
                      }}
                      className="border-b border-r border-black/5 px-3 py-1.5 cursor-text min-w-[120px]"
                    >
                      {isEditing ? (
                        col.type === 'select' ? (
                          <select
                            ref={cellInputRef as RefObject<HTMLSelectElement>}
                            value={cellDraft}
                            onChange={(e) => setCellDraft(e.target.value)}
                            onBlur={() => void commitCell()}
                            className="w-full rounded border border-primary/40 px-1 py-0.5 text-sm outline-none"
                          >
                            <option value="">—</option>
                            {(col.options ?? []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : col.type === 'boolean' ? (
                          <select
                            ref={cellInputRef as RefObject<HTMLSelectElement>}
                            value={cellDraft}
                            onChange={(e) => setCellDraft(e.target.value)}
                            onBlur={() => void commitCell()}
                            className="w-full rounded border border-primary/40 px-1 py-0.5 text-sm outline-none"
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        ) : (
                          <input
                            ref={cellInputRef as RefObject<HTMLInputElement>}
                            type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                            value={cellDraft}
                            onChange={(e) => setCellDraft(e.target.value)}
                            onBlur={() => void commitCell()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void commitCell();
                              if (e.key === 'Escape') setEditing(null);
                            }}
                            className="w-full rounded border border-primary/40 px-1 py-0.5 text-sm outline-none"
                          />
                        )
                      ) : (
                        <span className="text-gray-800">{formatCell(row.data[col.key], col.type) || '—'}</span>
                      )}
                    </td>
                  );
                })}
                <td className="border-b border-black/5" />
              </tr>
            ))}
            <tr>
              <td colSpan={table.columns.length + 2} className="px-2 py-2">
                <button
                  type="button"
                  disabled={addingRow}
                  onClick={() => void handleAddRow()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover disabled:opacity-50"
                >
                  {addingRow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Add row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ConnectFlowModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        tableId={tableId}
        columns={table.columns}
      />
    </div>
  );
}
