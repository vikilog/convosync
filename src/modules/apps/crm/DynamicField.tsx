/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lock } from 'lucide-react';
import type { CrmFieldValues, FieldDef } from './types';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';

type DynamicFieldProps = {
  field: FieldDef;
  values: CrmFieldValues;
  onChange: (key: string, value: string | boolean) => void;
};

export function DynamicField({ field, values, onChange }: DynamicFieldProps) {
  const value = values[field.key];

  return (
    <div className="mb-4">
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-swiss-ink">
        {field.label}
        {field.required ? <span className="text-danger-red">*</span> : null}
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
      </label>

      {field.type === 'textarea' ? (
        <Textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          rows={3}
          className="min-h-0 w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      ) : field.type === 'select' ? (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : field.type === 'checkbox' ? (
        <label className="flex items-center gap-2 text-sm text-swiss-ink">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(field.key, e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
          />
          Yes
        </label>
      ) : (
        <Input
          type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.type === 'phone' ? '+91' : undefined}
          className="h-auto w-full rounded-lg border border-swiss-line px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      )}
    </div>
  );
}
