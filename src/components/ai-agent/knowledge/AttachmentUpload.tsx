import React, { useRef, useState } from 'react';
import { CheckCircle2, Paperclip, Upload, Loader2 } from 'lucide-react';
import { api } from '../../../lib/api';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';

type Props = {
  onSaved: () => void;
};

function errorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  return message || 'Upload failed — please try again.';
}

/**
 * Saves to the shared Media Gallery (usage: 'agent') — the same store the
 * agent's send pipeline already reads from — instead of a per-agent record
 * nothing at send-time ever looked up.
 */
export const AttachmentUpload: React.FC<Props> = ({ onSaved }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    if (!file || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createMediaGalleryItem({
        title: name.trim(),
        description: description.trim() || name.trim(),
        scope: 'customer',
        usage: ['agent'],
        file,
      });
      setDone(true);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className="border-2 border-dashed border-swiss-line rounded-xl p-8 text-center hover:border-swiss-accent hover:bg-swiss-accent/5 transition-colors cursor-pointer"
      >
        <Upload className="w-8 h-8 text-swiss-accent mx-auto mb-3" />
        <p className="text-sm font-medium text-[#111827]">
          {file ? file.name : 'Upload PDF, image, video, or audio'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/*,video/*,audio/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1.5">Name</label>
        <div className="relative">
          <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Attachment name"
            className="h-auto w-full pl-10 pr-3 py-2.5 border border-swiss-line rounded-xl text-sm focus:ring-2 focus:ring-swiss-accent/20 focus:border-swiss-accent outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#111827] mb-1.5">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="When should this attachment be sent?"
          rows={3}
          className="min-h-0 w-full border border-swiss-line rounded-xl py-2.5 px-3 text-sm resize-none focus:ring-2 focus:ring-swiss-accent/20 focus:border-swiss-accent outline-none"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={!file || !name.trim() || saving || done}
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-swiss-accent hover:bg-swiss-accent-hover disabled:opacity-60 text-white rounded-xl text-sm font-bold"
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading…
          </>
        ) : done ? (
          <>
            <CheckCircle2 className="w-4 h-4" />
            Saved to Media Gallery
          </>
        ) : (
          'Save attachment'
        )}
      </button>
    </div>
  );
};
