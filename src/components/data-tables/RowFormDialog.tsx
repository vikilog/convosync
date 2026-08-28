/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { DataTableColumn, DataTableRow } from './types';

type Props = {
  open: boolean;
  onClose: () => void;
  columns: DataTableColumn[];
  row: DataTableRow | null;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
};

export function RowFormDialog({ open, onClose, columns, row, onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const initial: Record<string, string> = {};
    for (const col of columns) {
      const raw = row?.data[col.key];
      if (col.type === 'boolean') {
        initial[col.key] = raw === true || raw === 'true' ? 'true' : 'false';
      } else {
        initial[col.key] = raw == null ? '' : String(raw);
      }
    }
    setValues(initial);
    setError('');
  }, [open, row, columns]);

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, unknown> = {};
      for (const col of columns) {
        payload[col.key] = col.type === 'boolean' ? values[col.key] === 'true' : values[col.key];
      }
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save row');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{row ? 'Edit row' : 'Add row'}</DialogTitle>
          <DialogDescription>
            {row ? 'Update the values for this row.' : 'Fill in the values for the new row.'}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto py-1">
          {columns.map((col) => (
            <div key={col.id} className="space-y-1.5">
              <Label htmlFor={`field-${col.id}`}>{col.label}</Label>
              {col.type === 'boolean' ? (
                <div className="flex items-center gap-2">
                  <Switch
                    id={`field-${col.id}`}
                    checked={values[col.key] === 'true'}
                    onCheckedChange={(checked) =>
                      setValues((prev) => ({ ...prev, [col.key]: checked ? 'true' : 'false' }))
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {values[col.key] === 'true' ? 'Yes' : 'No'}
                  </span>
                </div>
              ) : col.type === 'select' ? (
                <Select
                  value={values[col.key] || undefined}
                  onValueChange={(v) => setValues((prev) => ({ ...prev, [col.key]: v }))}
                >
                  <SelectTrigger id={`field-${col.id}`} className="w-full">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(col.options ?? []).map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={`field-${col.id}`}
                  type={
                    col.type === 'number'
                      ? 'number'
                      : col.type === 'date'
                        ? 'date'
                        : col.type === 'email'
                          ? 'email'
                          : 'text'
                  }
                  value={values[col.key] ?? ''}
                  onChange={(e) => setValues((prev) => ({ ...prev, [col.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          {columns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a column first to fill in row data.</p>
          ) : null}
        </div>

        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {row ? 'Save changes' : 'Add row'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
