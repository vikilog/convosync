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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DATA_COLUMN_TYPE_OPTIONS, type DataColumnType } from './types';

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { label: string; type: DataColumnType; options?: string[] }) => Promise<void>;
};

export function AddColumnDialog({ open, onClose, onSubmit }: Props) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<DataColumnType>('text');
  const [options, setOptions] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLabel('');
    setType('text');
    setOptions('');
    setError('');
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError('Column name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        label: trimmed,
        type,
        options:
          type === 'select'
            ? options
                .split(',')
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add column');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !saving && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add column</DialogTitle>
          <DialogDescription>Define the name and type for the new column.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="new-col-label">Name</Label>
            <Input
              id="new-col-label"
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Preferred date"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-col-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DataColumnType)}>
              <SelectTrigger id="new-col-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_COLUMN_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {type === 'select' ? (
            <div className="space-y-1.5">
              <Label htmlFor="new-col-options">Choices</Label>
              <Input
                id="new-col-options"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="a, b, c"
              />
            </div>
          ) : null}
        </div>

        {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
