/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, ArrowDown, Trash2, Lock, Plus } from 'lucide-react';
import type { CrmEntityKind, FieldType } from './types';
import { addField, getEntitySchema, removeField, reorderField } from './store';
import { Input } from '../../../components/ui/input';

const ENTITY_LABEL: Record<CrmEntityKind, string> = {
  account: 'Account',
  contact: 'Contact',
  task: 'Task',
};

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'textarea', label: 'Long text' },
];

export function FieldBuilderView({ entity, onBack }: { entity: CrmEntityKind; onBack: () => void }) {
  const navigate = useNavigate();
  const [, forceRefresh] = useState(0);
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<FieldType>('text');
  const fields = getEntitySchema(entity);

  const refresh = () => forceRefresh((n) => n + 1);

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;
    addField(entity, {
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `field_${Date.now()}`,
      label,
      type: newType,
      options: newType === 'select' ? ['Option 1', 'Option 2'] : undefined,
    });
    setNewLabel('');
    refresh();
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-12">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-swiss-muted hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <h1 className="mt-4 text-lg font-semibold text-gray-950">Customize fields</h1>
      <p className="mt-1 text-xs text-swiss-muted">
        The same field builder works for every form in the CRM — pick which one you're editing.
      </p>

      <div className="mt-5 inline-flex gap-1 rounded-xl bg-slate-100 p-1">
        {(['account', 'contact', 'task'] as CrmEntityKind[]).map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => navigate(`/crm/fields/${e}`)}
            className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
              e === entity ? 'bg-white text-primary ' : 'text-swiss-muted'
            }`}
          >
            {ENTITY_LABEL[e]}
          </button>
        ))}
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-swiss-line overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-b-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-swiss-ink">{field.label}</span>
                {field.locked ? (
                  <span className="inline-flex items-center gap-1 rounded bg-[#e6fcef] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-primary">
                    <Lock className="h-2.5 w-2.5" />
                    Standard
                  </span>
                ) : (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-swiss-muted">
                    Custom
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-swiss-faint">
                {FIELD_TYPES.find((t) => t.value === field.type)?.label}
                {field.locked ? ' · matches your Contacts module' : ''}
              </p>
            </div>
            {!field.locked && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => {
                    reorderField(entity, field.id, 'up');
                    refresh();
                  }}
                  className="p-1.5 rounded-md text-swiss-faint hover:bg-black/5 hover:text-swiss-ink disabled:opacity-30"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === fields.length - 1}
                  onClick={() => {
                    reorderField(entity, field.id, 'down');
                    refresh();
                  }}
                  className="p-1.5 rounded-md text-swiss-faint hover:bg-black/5 hover:text-swiss-ink disabled:opacity-30"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeField(entity, field.id);
                    refresh();
                  }}
                  className="p-1.5 rounded-md text-swiss-faint hover:bg-red-50 hover:text-danger-red"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="flex items-center gap-2 bg-slate-50 p-3">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as FieldType)}
            className="rounded-lg border border-swiss-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <Input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Field label…"
            className="h-auto flex-1 rounded-lg border border-swiss-line bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-bold shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add field
          </button>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl"
        >
          Done
        </button>
      </div>
    </div>
  );
}
