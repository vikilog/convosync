/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { DATA_COLUMN_TYPE_OPTIONS, type DataColumnType, type DataTableRecord } from './types';
import { Input } from '../ui/input';

type DraftColumn = { label: string; type: DataColumnType; options: string };

const STARTER_COLUMNS: DraftColumn[] = [
  { label: 'Name', type: 'text', options: '' },
  { label: 'Phone', type: 'phone', options: '' },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (table: DataTableRecord) => void;
};

export function CreateDataTableModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [columns, setColumns] = useState<DraftColumn[]>(STARTER_COLUMNS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setColumns(STARTER_COLUMNS);
    setError('');
  }, [open]);

  if (!open) return null;

  const updateColumn = (i: number, patch: Partial<DraftColumn>) => {
    setColumns((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Table name is required.');
      return;
    }
    const cleanColumns = columns.filter((c) => c.label.trim());
    if (cleanColumns.length === 0) {
      setError('Add at least one column.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = (await api.createDataTable({
        name: trimmedName,
        description: description.trim() || undefined,
        columns: cleanColumns.map((c) => ({
          label: c.label.trim(),
          type: c.type,
          options:
            c.type === 'select'
              ? c.options
                  .split(',')
                  .map((o) => o.trim())
                  .filter(Boolean)
              : undefined,
        })),
      })) as { item: DataTableRecord };
      onCreated(res.item);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create table');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="absolute inset-0" onClick={() => !saving && onClose()} aria-hidden />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative w-full max-w-lg space-y-4 bg-white border border-swiss-line p-6 shadow-xl max-h-[85vh] overflow-y-auto"
      >
        <div>
          <h3 className="text-base font-semibold text-gray-950">New table</h3>
          <p className="mt-1 text-xs text-slate-500">
            Design the columns now — you can add or remove them later.
          </p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-swiss-muted uppercase tracking-wide">
            Table name <span className="text-red-500">*</span>
          </span>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Appointment bookings"
            className="h-auto w-full rounded-xl border border-swiss-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-swiss-muted uppercase tracking-wide">
            Description
          </span>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional"
            className="h-auto w-full rounded-xl border border-swiss-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-bold text-swiss-muted uppercase tracking-wide">Columns</span>
          <div className="space-y-2">
            {columns.map((col, i) => (
              <div key={i} className="flex items-start gap-2">
                <Input
                  value={col.label}
                  onChange={(e) => updateColumn(i, { label: e.target.value })}
                  placeholder="Column name"
                  className="h-auto flex-1 rounded-lg border border-swiss-line px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <select
                  value={col.type}
                  onChange={(e) => updateColumn(i, { type: e.target.value as DataColumnType })}
                  className="w-36 rounded-lg border border-swiss-line px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {DATA_COLUMN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setColumns((prev) => prev.filter((_, idx) => idx !== i))}
                  className="p-1.5 rounded-lg text-swiss-faint hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove column"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {columns.map((col, i) =>
              col.type === 'select' ? (
                <Input
                  key={`opts-${i}`}
                  value={col.options}
                  onChange={(e) => updateColumn(i, { options: e.target.value })}
                  placeholder={`Choices for "${col.label || 'column'}", comma separated`}
                  className="h-auto w-full rounded-lg border border-swiss-line px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              ) : null
            )}
          </div>
          <button
            type="button"
            onClick={() => setColumns((prev) => [...prev, { label: '', type: 'text', options: '' }])}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover"
          >
            <Plus className="w-3.5 h-3.5" />
            Add column
          </button>
        </div>

        {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-lg border border-swiss-line px-4 py-2 text-sm font-semibold text-swiss-ink hover:bg-surface-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create table
          </button>
        </div>
      </form>
    </div>
  );
}
