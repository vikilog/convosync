/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useId, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { api, type WorkspaceTagRecord } from '../../lib/api';
import { Input } from '../ui/input';

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (tag: WorkspaceTagRecord) => void;
  /** Existing folder names, offered as datalist suggestions. */
  folders: string[];
  /** Set to edit an existing tag; null/undefined creates a new one. */
  editingTag?: WorkspaceTagRecord | null;
};

export function CreateTagModal({ open, onClose, onSaved, folders, editingTag }: Props) {
  const isEdit = Boolean(editingTag);
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const folderListId = useId();

  useEffect(() => {
    if (!open) return;
    setName(editingTag?.name ?? '');
    setFolder(editingTag?.folder ?? '');
    setError(null);
  }, [open, editingTag]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Tag name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: trimmed, folder: folder.trim() || null };
      const saved =
        isEdit && editingTag
          ? await api.updateWorkspaceTag(editingTag.id, payload)
          : await api.createWorkspaceTag(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save tag');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="absolute inset-0" onClick={() => !saving && onClose()} aria-hidden />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative w-full max-w-md space-y-4 bg-white border border-swiss-line p-6 shadow-xl"
      >
        <div>
          <h3 className="text-base font-semibold text-gray-950">{isEdit ? 'Edit tag' : 'New tag'}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Tags help you segment contacts and trigger automations. Group related tags into a
            folder to keep pickers tidy.
          </p>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-swiss-muted uppercase tracking-wide">
            Name <span className="text-red-500">*</span>
          </span>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. VIP"
            className="h-auto w-full rounded-xl border border-swiss-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-swiss-muted uppercase tracking-wide">Folder</span>
          <Input
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            list={folderListId}
            placeholder="Tags"
            className="h-auto w-full rounded-xl border border-swiss-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <datalist id={folderListId}>
            {folders.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
          <span className="text-xs text-slate-400">Leave blank to file it under &quot;Tags&quot;.</span>
        </label>

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
            {isEdit ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
