/**
 * Prompt modal for AI email template generation.
 */
import React, { useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<void>;
};

export function AiGenerateModal({ open, onClose, onGenerate }: Props) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const submit = async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 3) {
      setError('Describe the email you want (at least a few words).');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onGenerate(trimmed);
      setPrompt('');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI generation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-labelledby="ai-email-gen-title"
        className="w-full max-w-lg rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 id="ai-email-gen-title" className="text-sm font-bold text-gray-900">
                Generate with AI
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Describe the email — we&apos;ll build blocks with {'{{variables}}'}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-2 rounded-lg hover:bg-surface-muted text-gray-500 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            disabled={busy}
            placeholder="e.g. Welcome email for new customers: thank them, mention a 10% off code, CTA to shop, use {{first_name}} and {{company_name}}"
            className="w-full rounded-xl bg-surface-muted px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y min-h-[120px]"
          />
          {error ? (
            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-black/5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-surface-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-bold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
